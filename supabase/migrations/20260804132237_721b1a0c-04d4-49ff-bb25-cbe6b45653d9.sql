
-- ============ ORGANIZER PROFILES ============
CREATE TABLE public.organizer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text,
  logo_url text,
  website_url text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  brand_primary_color text,
  brand_secondary_color text,
  is_verified boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT ON public.organizer_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizer_profiles TO authenticated;
GRANT ALL ON public.organizer_profiles TO service_role;
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizer_profiles_public_read ON public.organizer_profiles
  FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY organizer_profiles_owner_all ON public.organizer_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER organizer_profiles_updated_at BEFORE UPDATE ON public.organizer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ GOOGLE CONNECTIONS ============
CREATE TABLE public.google_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email text,
  google_account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  spreadsheet_id text,
  spreadsheet_name text,
  spreadsheet_url text,
  worksheet_name text NOT NULL DEFAULT 'Registrations',
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  last_sync_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_connections TO authenticated;
GRANT ALL ON public.google_connections TO service_role;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY google_connections_owner_all ON public.google_connections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER google_connections_updated_at BEFORE UPDATE ON public.google_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REGISTRATION FORMS ============
CREATE TABLE public.registration_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Registration Form',
  description text,
  success_message text,
  collect_phone boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  opens_at timestamptz,
  closes_at timestamptz,
  max_registrations integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.registration_forms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_forms TO authenticated;
GRANT ALL ON public.registration_forms TO service_role;
ALTER TABLE public.registration_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY registration_forms_public_read ON public.registration_forms
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true
    AND e.visibility = ANY (ARRAY['public'::event_visibility, 'unlisted'::event_visibility])));
CREATE POLICY registration_forms_host_all ON public.registration_forms
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TRIGGER registration_forms_updated_at BEFORE UPDATE ON public.registration_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.event_fields
  ADD COLUMN form_id uuid REFERENCES public.registration_forms(id) ON DELETE CASCADE,
  ADD COLUMN help_text text,
  ADD COLUMN placeholder text;

-- ============ EVENT TICKETS (future paid events) ============
CREATE TABLE public.event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  quantity_total integer,
  quantity_sold integer NOT NULL DEFAULT 0,
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_tickets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_tickets TO authenticated;
GRANT ALL ON public.event_tickets TO service_role;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_tickets_public_read ON public.event_tickets
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true
    AND e.visibility = ANY (ARRAY['public'::event_visibility, 'unlisted'::event_visibility])));
CREATE POLICY event_tickets_host_all ON public.event_tickets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.host_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TRIGGER event_tickets_updated_at BEFORE UPDATE ON public.event_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FUTURE-PROOF COLUMNS ============
ALTER TABLE public.events
  ADD COLUMN organizer_profile_id uuid REFERENCES public.organizer_profiles(id) ON DELETE SET NULL,
  ADD COLUMN end_date date,
  ADD COLUMN end_time time,
  ADD COLUMN capacity integer,
  ADD COLUMN is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN base_price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN recurrence_rule text,
  ADD COLUMN parent_event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN referrals_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN certificates_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN checkin_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.registrations
  ADD COLUMN form_id uuid REFERENCES public.registration_forms(id) ON DELETE SET NULL,
  ADD COLUMN ticket_id uuid REFERENCES public.event_tickets(id) ON DELETE SET NULL,
  ADD COLUMN status text NOT NULL DEFAULT 'confirmed',
  ADD COLUMN ticket_code text,
  ADD COLUMN checked_in_at timestamptz,
  ADD COLUMN referral_code text,
  ADD COLUMN referred_by uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
  ADD COLUMN amount_paid_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN certificate_issued_at timestamptz,
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX idx_events_host ON public.events(host_id);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_parent ON public.events(parent_event_id);
CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_registrations_email ON public.registrations(email);
CREATE INDEX idx_event_fields_form ON public.event_fields(form_id);
CREATE INDEX idx_event_tickets_event ON public.event_tickets(event_id);
CREATE INDEX idx_registration_forms_event ON public.registration_forms(event_id);
