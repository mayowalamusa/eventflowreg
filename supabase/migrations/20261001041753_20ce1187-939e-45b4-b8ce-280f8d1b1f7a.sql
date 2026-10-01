-- 1) Storage reads are bound to the uploader; public pages get links minted by the app.
DROP POLICY IF EXISTS "banners_read" ON storage.objects;
CREATE POLICY "banners_owner_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'event-banners'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "organizer_logos_public_read" ON storage.objects;
CREATE POLICY "organizer_logos_owner_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'organizer-logos'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 2) Site settings: public branding row, but a real row-level predicate.
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (id IS TRUE);