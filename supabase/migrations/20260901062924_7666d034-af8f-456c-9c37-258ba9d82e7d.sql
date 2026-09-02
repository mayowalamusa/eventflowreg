-- Phase 4: Google Sheets integration.
--
-- 1) SECURITY FIX: google_connections currently grants `authenticated` direct
--    SELECT/INSERT/UPDATE/DELETE, plus an owner-scoped RLS policy
--    (`google_connections_owner_all`) that lets a host SELECT their own raw
--    access_token/refresh_token straight from the browser, and write to the
--    row (including access_token/refresh_token) without going through any
--    server-side validation at all. Now that this table will hold real
--    Google OAuth credentials, that's no longer acceptable.
--
--    Going forward, NOTHING in this table is touched by the client
--    directly. Every read and write goes through JWT-authenticated Edge
--    Functions using the service role, which return only sanitized fields
--    to the browser. So we revoke the broad grant and drop the policy,
--    leaving RLS enabled with zero client-facing policies (default deny for
--    `anon`/`authenticated`; `service_role` already has `GRANT ALL` and
--    bypasses RLS regardless).
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.google_connections FROM authenticated;
DROP POLICY IF EXISTS google_connections_owner_all ON public.google_connections;

-- 2) Host-configurable EventFlow-field -> spreadsheet-column mapping.
--    Kept as its own typed column rather than folded into the generic
--    `metadata` jsonb catch-all, since this is a first-class, host-edited
--    feature the UI manages directly, not incidental bookkeeping.
--    Shape: { "<eventflow_field_key>": "<Sheet Column Header>", ... }
ALTER TABLE public.google_connections
  ADD COLUMN field_mapping jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3) Sync run history. Per-registration idempotency is already covered by
--    the existing `registrations.synced_to_sheet` boolean — nothing new
--    needed there. But "sync history" (date/time, counts, status, errors)
--    is a per-run summary that has nowhere to live today; the old mock UI
--    hardcoded it. This table replaces that.
--
--    `updated_count` is included for schema/UI completeness (sync history
--    is expected to show it) but registrations are immutable in this app
--    today (no UPDATE policy, no edit UI), so it will always be 0 in
--    practice — appends are the only thing that happens. Documented here
--    rather than silently omitted or faked.
CREATE TABLE public.sheet_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES public.google_connections(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  processed_count integer NOT NULL DEFAULT 0,
  added_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  error text,
  details jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_sheet_sync_runs_user ON public.sheet_sync_runs (user_id, started_at DESC);

ALTER TABLE public.sheet_sync_runs ENABLE ROW LEVEL SECURITY;

-- Hosts may read their own sync history (dashboard display). All writes
-- happen via the sync Edge Function using the service role.
CREATE POLICY sheet_sync_runs_owner_read ON public.sheet_sync_runs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.sheet_sync_runs TO authenticated;
GRANT ALL ON public.sheet_sync_runs TO service_role;

-- 4) Short-lived CSRF state for the OAuth handshake. A random token is
--    minted when a host clicks "Connect", stored here with their user id,
--    and consumed (deleted) by the callback after verifying it matches and
--    hasn't expired. This is what lets the public, unauthenticated
--    oauth-callback function know which host is completing the flow
--    without trusting anything else in the redirect.
CREATE TABLE public.google_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_oauth_states ENABLE ROW LEVEL SECURITY;
-- No client-facing policies: only the service role (Edge Functions) reads
-- or writes this table. A host has no legitimate reason to query it.
GRANT ALL ON public.google_oauth_states TO service_role;