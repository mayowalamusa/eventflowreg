-- Phase 3: track confirmation email delivery per registration.
--
-- These columns are only ever written by the send-registration-email Edge
-- Function using the service-role key. `registrations` has no client-facing
-- UPDATE policy (only INSERT/SELECT/DELETE), so no anon/authenticated client
-- can set or forge these values — that's intentional and unchanged here.
-- Existing SELECT policies (registrations_host_read) already expose all
-- columns on rows the host is allowed to see, so hosts can read these too
-- without any policy change.

ALTER TABLE public.registrations
  ADD COLUMN email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN email_sent_at timestamptz,
  ADD COLUMN email_error text;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_email_status_check
  CHECK (email_status IN ('pending', 'sent', 'failed'));

COMMENT ON COLUMN public.registrations.email_status IS
  'pending = not yet attempted, sent = confirmation email delivered to provider, failed = delivery attempt failed (see email_error). Written only by the send-registration-email Edge Function via the service role.';
COMMENT ON COLUMN public.registrations.email_sent_at IS 'Set when the confirmation email was accepted by the provider.';
COMMENT ON COLUMN public.registrations.email_error IS 'Last delivery error message, if any. Truncated, non-sensitive.';
