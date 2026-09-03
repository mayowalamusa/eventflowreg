-- 1. Restrict follower visibility
DROP POLICY IF EXISTS "organizer_followers_public_read" ON public.organizer_followers;

CREATE POLICY "organizer_followers_self_read"
  ON public.organizer_followers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "organizer_followers_owner_read"
  ON public.organizer_followers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organizer_profiles p
    WHERE p.id = organizer_profile_id AND p.user_id = auth.uid()
  ));

REVOKE SELECT ON public.organizer_followers FROM anon;

-- Public pages need only an aggregate count, never identities.
CREATE OR REPLACE FUNCTION public.organizer_follower_count(_profile_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.organizer_followers f
  JOIN public.organizer_profiles p ON p.id = f.organizer_profile_id
  WHERE f.organizer_profile_id = _profile_id
    AND p.is_published = true;
$$;

REVOKE ALL ON FUNCTION public.organizer_follower_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organizer_follower_count(uuid) TO anon, authenticated;

-- 2. Scope SECURITY DEFINER helpers to the caller only
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN current_setting('role', true) = 'service_role' OR auth.uid() = _user_id THEN
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN current_setting('role', true) = 'service_role' OR auth.uid() = _user_id THEN
      COALESCE((SELECT p.is_suspended FROM public.profiles p WHERE p.id = _user_id), false)
    ELSE false
  END;
$$;
