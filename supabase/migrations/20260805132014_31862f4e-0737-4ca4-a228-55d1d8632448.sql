ALTER TABLE public.organizer_profiles
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text;

CREATE UNIQUE INDEX IF NOT EXISTS organizer_profiles_user_id_key ON public.organizer_profiles (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS organizer_profiles_handle_key ON public.organizer_profiles (lower(handle));

CREATE TABLE IF NOT EXISTS public.organizer_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_profile_id uuid NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_profile_id, user_id)
);

GRANT SELECT ON public.organizer_followers TO anon;
GRANT SELECT, INSERT, DELETE ON public.organizer_followers TO authenticated;
GRANT ALL ON public.organizer_followers TO service_role;

ALTER TABLE public.organizer_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizer_followers_public_read" ON public.organizer_followers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "organizer_followers_self_insert" ON public.organizer_followers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "organizer_followers_self_delete" ON public.organizer_followers
  FOR DELETE TO authenticated USING (user_id = auth.uid());