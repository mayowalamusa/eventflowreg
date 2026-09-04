-- 1. Enums
CREATE TYPE public.admin_tier AS ENUM ('super_admin', 'manager');
CREATE TYPE public.admin_area AS ENUM ('overview', 'users', 'events', 'registrations', 'payments', 'errors', 'analytics', 'settings');

-- 2. Admin accounts
CREATE TABLE public.admin_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.admin_tier NOT NULL DEFAULT 'manager',
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_accounts TO authenticated;
GRANT ALL ON public.admin_accounts TO service_role;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area public.admin_area NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, area)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Helpers
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN current_setting('role', true) = 'service_role' OR auth.uid() = _user_id THEN
      EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.user_id = _user_id AND a.tier = 'super_admin')
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_area(_user_id uuid, _area public.admin_area)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN current_setting('role', true) = 'service_role' OR auth.uid() = _user_id THEN
      EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.user_id = _user_id AND a.tier = 'super_admin')
      OR EXISTS (
        SELECT 1 FROM public.admin_accounts a
        JOIN public.admin_permissions p ON p.user_id = a.user_id
        WHERE a.user_id = _user_id AND p.area = _area
      )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN current_setting('role', true) = 'service_role' OR auth.uid() = _user_id THEN
      EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.user_id = _user_id)
    ELSE false
  END;
$$;

-- Policies on the admin tables themselves
CREATE POLICY admin_accounts_read ON public.admin_accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY admin_accounts_super_write ON public.admin_accounts FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY admin_permissions_read ON public.admin_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY admin_permissions_super_write ON public.admin_permissions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER admin_accounts_updated_at BEFORE UPDATE ON public.admin_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Site settings (singleton)
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  site_name text NOT NULL DEFAULT 'EventFlow',
  tagline text,
  logo_url text,
  favicon_url text,
  og_image_url text,
  support_email text,
  support_phone text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  footer_text text,
  maintenance_mode boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY site_settings_public_read ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_settings_super_insert ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY site_settings_super_update ON public.site_settings FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.site_settings (id, site_name, tagline, footer_text)
VALUES (true, 'EventFlow', 'Event registration made simple', 'Built with EventFlow');

-- 5. Error log
CREATE TABLE public.app_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL UNIQUE,
  message text NOT NULL,
  stack text,
  url text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent text,
  severity text NOT NULL DEFAULT 'error',
  source text NOT NULL DEFAULT 'client',
  occurrences integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT INSERT ON public.app_error_logs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_error_logs TO authenticated;
GRANT ALL ON public.app_error_logs TO service_role;
ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_error_logs_insert ON public.app_error_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY app_error_logs_admin_read ON public.app_error_logs FOR SELECT TO authenticated
  USING (public.has_admin_area(auth.uid(), 'errors'));
CREATE POLICY app_error_logs_admin_update ON public.app_error_logs FOR UPDATE TO authenticated
  USING (public.has_admin_area(auth.uid(), 'errors')) WITH CHECK (public.has_admin_area(auth.uid(), 'errors'));
CREATE INDEX app_error_logs_last_seen_idx ON public.app_error_logs (last_seen_at DESC);

-- 6. Promote existing admins to super admins
INSERT INTO public.admin_accounts (user_id, tier)
SELECT user_id, 'super_admin' FROM public.user_roles WHERE role = 'admin'
ON CONFLICT (user_id) DO UPDATE SET tier = 'super_admin';

-- 7. Replace blanket admin access with area-scoped access
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_admin_area(auth.uid(), 'users'));
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_admin_area(auth.uid(), 'users'))
  WITH CHECK (id = auth.uid() OR public.has_admin_area(auth.uid(), 'users'));

DROP POLICY IF EXISTS roles_select_own ON public.user_roles;
CREATE POLICY roles_select_own ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_area(auth.uid(), 'users'));

DROP POLICY IF EXISTS organizer_profiles_owner_all ON public.organizer_profiles;
CREATE POLICY organizer_profiles_owner_all ON public.organizer_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_area(auth.uid(), 'users'))
  WITH CHECK (user_id = auth.uid() OR public.has_admin_area(auth.uid(), 'users'));

DROP POLICY IF EXISTS events_host_read ON public.events;
CREATE POLICY events_host_read ON public.events FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events'));
DROP POLICY IF EXISTS events_host_update ON public.events;
CREATE POLICY events_host_update ON public.events FOR UPDATE TO authenticated
  USING (host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events'))
  WITH CHECK ((host_id = auth.uid() AND NOT public.is_suspended(auth.uid())) OR public.has_admin_area(auth.uid(), 'events'));
DROP POLICY IF EXISTS events_host_delete ON public.events;
CREATE POLICY events_host_delete ON public.events FOR DELETE TO authenticated
  USING (host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events'));

DROP POLICY IF EXISTS fields_host_all ON public.event_fields;
CREATE POLICY fields_host_all ON public.event_fields FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_fields.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_fields.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events'))));

DROP POLICY IF EXISTS registration_forms_host_all ON public.registration_forms;
CREATE POLICY registration_forms_host_all ON public.registration_forms FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = registration_forms.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = registration_forms.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events'))));

DROP POLICY IF EXISTS event_tickets_host_all ON public.event_tickets;
CREATE POLICY event_tickets_host_all ON public.event_tickets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_tickets.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events') OR public.has_admin_area(auth.uid(), 'payments'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_tickets.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'events'))));

DROP POLICY IF EXISTS registrations_host_read ON public.registrations;
CREATE POLICY registrations_host_read ON public.registrations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = registrations.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'registrations') OR public.has_admin_area(auth.uid(), 'payments'))));
DROP POLICY IF EXISTS registrations_host_update ON public.registrations;
CREATE POLICY registrations_host_update ON public.registrations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = registrations.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'registrations'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = registrations.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'registrations'))));
DROP POLICY IF EXISTS registrations_host_delete ON public.registrations;
CREATE POLICY registrations_host_delete ON public.registrations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = registrations.event_id AND (e.host_id = auth.uid() OR public.has_admin_area(auth.uid(), 'registrations'))));

DROP POLICY IF EXISTS admin_audit_log_admin_read ON public.admin_audit_log;
CREATE POLICY admin_audit_log_admin_read ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_admin_area(auth.uid(), 'errors'));
DROP POLICY IF EXISTS admin_audit_log_admin_insert ON public.admin_audit_log;
CREATE POLICY admin_audit_log_admin_insert ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_member(auth.uid()) AND actor_id = auth.uid());