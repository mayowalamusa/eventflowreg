-- Self-service account deletion with a 90-day recovery window, and a
-- defense-in-depth uniqueness constraint on profiles.email.
--
-- DESIGN NOTE (confirmed, not assumed): events.host_id and
-- registrations.event_id both cascade through ON DELETE CASCADE chains
-- rooted at auth.users. Because EventFlow attendees have no independent
-- login account of their own (registering for an event is always an
-- anonymous insert — see registrations_public_insert), a host's data is
-- the only account-level identity involved here. Hard-deleting a host
-- after the 90-day window (see purge-deleted-accounts) intentionally
-- cascades their events and registrations along with it — there is no
-- separate attendee identity left behind to protect. If EventFlow ever
-- adds attendee-side login accounts, this decision needs revisiting.
--
-- This migration implements the reversible 90-day part. What happens at
-- the end of the window if never restored is handled by the
-- purge-deleted-accounts Edge Function (see repo).

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
