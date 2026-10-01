-- 1) Email uniqueness on the profiles mirror.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 2) Deletion request tracking.
ALTER TABLE public.profiles ADD COLUMN deletion_requested_at timestamptz;

CREATE OR REPLACE FUNCTION public.is_pending_deletion(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT p.deletion_requested_at IS NOT NULL FROM public.profiles p WHERE p.id = _user_id), false);
$$;
REVOKE ALL ON FUNCTION public.is_pending_deletion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pending_deletion(uuid) TO authenticated;

-- 3) Pending-deletion hosts lose public discoverability and new registrations.
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