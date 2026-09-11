-- Self-service account deletion with a 90-day recovery window, and a
-- defense-in-depth uniqueness constraint on profiles.email.
--
-- IMPORTANT DESIGN NOTE, read before relying on this in production:
-- events.host_id and registrations.event_id both cascade through
-- ON DELETE CASCADE chains rooted at auth.users. A true hard-delete of a
-- host's auth.users row would therefore silently destroy every attendee's
-- registration record for that host's events too — not just the host's
-- own data. That's a serious, easy-to-miss side effect of "delete my
-- account" for a platform where other people's data (attendees) hangs off
-- a host's account.
--
-- This migration implements the reversible, unambiguous part: a 90-day
-- soft-delete/restore cycle. What happens at the end of the 90 days if
-- never restored is intentionally left as a *choice*, not a default:
--   (a) anonymize — scrub the host's PII, disable login, but keep events/
--       registrations intact (attendees' history survives), or
--   (b) hard-delete — actually remove the auth user, cascading everything.
-- The purge-deleted-accounts Edge Function (see repo) implements (a) by
-- default. Switching to (b) is a real product decision, not a technical
-- detail, and should be made deliberately — see that function's comments.

-- 1) Email uniqueness on the profiles mirror. auth.users.email is already
--    uniquely constrained by Supabase Auth itself — this is defense in
--    depth for the denormalized copy only, not the real guarantee.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 2) Deletion request tracking.
ALTER TABLE public.profiles ADD COLUMN deletion_requested_at timestamptz;

CREATE OR REPLACE FUNCTION public.is_pending_deletion(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.deletion_requested_at IS NOT NULL FROM public.profiles p WHERE p.id = _user_id), false);
$$;
REVOKE ALL ON FUNCTION public.is_pending_deletion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pending_deletion(uuid) TO authenticated;

-- 3) While a host's account is pending deletion, their events stop being
--    publicly discoverable and stop accepting new registrations — without
--    mutating is_published at all, so nothing needs to be "remembered" and
--    restored later. Restoring is simply clearing deletion_requested_at;
--    everything else falls back into place automatically because these
--    checks are live, not a one-time side effect.
DROP POLICY IF EXISTS "events_public_read" ON public.events;
CREATE POLICY "events_public_read" ON public.events FOR SELECT TO anon, authenticated
  USING (
    is_published = true
    AND visibility IN ('public', 'unlisted')
    AND archived_at IS NULL
    AND NOT public.is_pending_deletion(host_id)
  );

DROP POLICY IF EXISTS "registrations_public_insert" ON public.registrations;
CREATE POLICY "registrations_public_insert" ON public.registrations FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.is_published = true AND NOT public.is_pending_deletion(e.host_id)
    )
  );

-- events_host_read/update are unchanged: a host can still see and manage
-- their own events during the grace period (e.g. to restore, or to review
-- what's about to happen) — the restriction is on public visibility and
-- new registrations, not on the host's own access to their data.
