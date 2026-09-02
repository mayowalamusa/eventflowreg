-- Registrations contain PII (name, email, phone) and are published to Realtime.
-- Realtime postgres_changes honours RLS, but table-level grants were still wide
-- open for anon. Reduce anon to INSERT-only so no relaxation of policies can
-- accidentally broadcast or expose attendee PII to the public role.
REVOKE ALL ON public.registrations FROM anon;
GRANT INSERT ON public.registrations TO anon;

REVOKE ALL ON public.registrations FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;

GRANT ALL ON public.registrations TO service_role;

-- Hosts/admins had SELECT + DELETE but no UPDATE policy, so legitimate
-- check-in / status management had no scoped path. Add an explicit, narrowly
-- scoped UPDATE policy (owner of the event or admin only).
DROP POLICY IF EXISTS registrations_host_update ON public.registrations;
CREATE POLICY registrations_host_update
ON public.registrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = registrations.event_id
      AND (e.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = registrations.event_id
      AND (e.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

COMMENT ON TABLE public.registrations IS
  'Attendee PII. SELECT/UPDATE/DELETE restricted to the event host or an admin; anon may only INSERT. Do not add public read policies - this table is in the supabase_realtime publication.';