-- Phase 5: real admin system — suspension enforcement, event archiving,
-- and a minimal audit trail for admin mutations.

-- 1) SUSPENSION ENFORCEMENT
--    profiles.is_suspended already existed but was enforced nowhere. Mirrors
--    the existing has_role() pattern exactly: a small SECURITY DEFINER
--    helper, used directly inside RLS policies, so suspension is enforced
--    at the database layer rather than only hidden in the UI.
--
--    Scope: "restricted host actions" is interpreted narrowly and
--    deliberately as creating/publishing event content — the core lever a
--    problematic host would use. Other host-managed tables (organizer
--    profile, registration forms, Google Sheets connection, etc.) are left
--    untouched here rather than widening this migration to every table;
--    that's a scoping decision, not an oversight.
CREATE OR REPLACE FUNCTION public.is_suspended(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.is_suspended FROM public.profiles p WHERE p.id = _user_id), false);
$$;
REVOKE ALL ON FUNCTION public.is_suspended(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_suspended(uuid) TO authenticated;

DROP POLICY IF EXISTS "events_host_insert" ON public.events;
CREATE POLICY "events_host_insert" ON public.events FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid() AND NOT public.is_suspended(auth.uid()));

DROP POLICY IF EXISTS "events_host_update" ON public.events;
CREATE POLICY "events_host_update" ON public.events FOR UPDATE TO authenticated
  USING (host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (
    (host_id = auth.uid() AND NOT public.is_suspended(auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );
-- events_host_delete is left as-is: deleting isn't the concern here, and a
-- suspended host removing their own already-created content isn't the
-- restriction this phase is aimed at.

-- 2) EVENT ARCHIVING (soft delete)
--    registrations.event_id is ON DELETE CASCADE — a hard delete of an
--    event already silently destroys every one of its registrations today
--    (including email/sync delivery history from Phases 3–4). That's an
--    unacceptable trade-off for an admin moderation action, so "Delete
--    Event" in the admin panel is implemented as an archive: the event
--    stops appearing publicly and can no longer accept new registrations,
--    but every registration row — and the event row itself — survives
--    intact. This is deliberately simpler than a restricted/cascading
--    delete strategy: nothing is destroyed, nothing needs restoring later,
--    and the existing FK behavior for hosts' own hard-delete is left
--    untouched (out of scope for this phase — see the Phase 5 report).
ALTER TABLE public.events ADD COLUMN archived_at timestamptz;

DROP POLICY IF EXISTS "events_public_read" ON public.events;
CREATE POLICY "events_public_read" ON public.events FOR SELECT TO anon, authenticated
  USING (is_published = true AND visibility IN ('public', 'unlisted') AND archived_at IS NULL);
-- events_host_read is unchanged: a host can still see their own archived
-- events (and that they were archived), just not the public.

-- 3) MINIMAL ADMIN AUDIT LOG
--    Suspending a user and archiving an event are both consequential,
--    hard-to-notice-after-the-fact actions taken on someone else's behalf.
--    A single flat table is enough — no diffing, no snapshots.
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_log_created ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log_admin_read" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- An admin may only log an action as themselves — prevents one admin
-- forging an entry attributed to another.
CREATE POLICY "admin_audit_log_admin_insert" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_id = auth.uid());

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
