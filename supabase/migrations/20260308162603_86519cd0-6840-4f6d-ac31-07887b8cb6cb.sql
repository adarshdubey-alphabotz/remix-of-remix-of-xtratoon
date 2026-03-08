
-- Create a public storage bucket for cached manga images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('manga-images', 'manga-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the bucket (public CDN access)
CREATE POLICY "Public read access for manga images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'manga-images');

-- Allow service role (edge functions) to insert/update
CREATE POLICY "Service role can upload manga images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'manga-images');

CREATE POLICY "Service role can update manga images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'manga-images');
