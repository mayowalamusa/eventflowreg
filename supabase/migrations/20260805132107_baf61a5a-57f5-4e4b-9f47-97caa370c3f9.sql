CREATE POLICY "organizer_logos_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'organizer-logos');

CREATE POLICY "organizer_logos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'organizer-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "organizer_logos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'organizer-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'organizer-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "organizer_logos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'organizer-logos' AND (storage.foldername(name))[1] = auth.uid()::text);