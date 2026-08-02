CREATE TYPE public.app_role AS ENUM ('admin','host');
CREATE TYPE public.event_type AS ENUM ('online','physical');
CREATE TYPE public.event_visibility AS ENUM ('public','private','unlisted');
CREATE TYPE public.destination_type AS ENUM ('whatsapp','telegram','zoom','google_meet','microsoft_teams','custom');
CREATE TYPE public.field_type AS ENUM ('short_text','long_text','dropdown','radio','checkbox');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  organizer_name TEXT,
  category TEXT,
  event_type public.event_type NOT NULL DEFAULT 'online',
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  location TEXT,
  visibility public.event_visibility NOT NULL DEFAULT 'public',
  destination_type public.destination_type NOT NULL DEFAULT 'custom',
  destination_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  google_sheet_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read" ON public.events FOR SELECT TO anon, authenticated USING (is_published = true AND visibility IN ('public','unlisted'));
CREATE POLICY "events_host_read" ON public.events FOR SELECT TO authenticated USING (host_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "events_host_insert" ON public.events FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "events_host_update" ON public.events FOR UPDATE TO authenticated USING (host_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (host_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "events_host_delete" ON public.events FOR DELETE TO authenticated USING (host_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.event_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type public.field_type NOT NULL DEFAULT 'short_text',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_fields TO authenticated;
GRANT SELECT ON public.event_fields TO anon;
GRANT ALL ON public.event_fields TO service_role;
ALTER TABLE public.event_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fields_public_read" ON public.event_fields FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true AND e.visibility IN ('public','unlisted')));
CREATE POLICY "fields_host_all" ON public.event_fields FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.host_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.host_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  custom_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_to_sheet BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX registrations_event_idx ON public.registrations(event_id);
GRANT SELECT, INSERT, DELETE ON public.registrations TO authenticated;
GRANT INSERT ON public.registrations TO anon;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations_public_insert" ON public.registrations FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true));
CREATE POLICY "registrations_host_read" ON public.registrations FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.host_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "registrations_host_delete" ON public.registrations FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.host_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'host') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;