-- Phase 6: production hardening — close a real upload gap found during
-- audit. Neither storage bucket had a server-side file size or MIME type
-- limit. The client's accept="image/*" and the one ad-hoc 5MB check in
-- dashboard.organizer.tsx are both trivially bypassable (devtools, direct
-- API calls) — the bucket itself is the only enforcement that can't be
-- worked around by the client. Limits match what the UI already claims
-- ("JPG, PNG up to 5MB") rather than inventing new ones.
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id IN ('event-banners', 'organizer-logos');
