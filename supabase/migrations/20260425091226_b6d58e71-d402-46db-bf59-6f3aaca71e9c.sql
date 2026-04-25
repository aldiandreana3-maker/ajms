
-- Buat bucket publik untuk media WA Blast (agar Fonnte bisa mengakses URL media)
INSERT INTO storage.buckets (id, name, public)
VALUES ('wa-blast-media', 'wa-blast-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS policies untuk bucket wa-blast-media
DROP POLICY IF EXISTS "WA Blast media public read" ON storage.objects;
CREATE POLICY "WA Blast media public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'wa-blast-media');

DROP POLICY IF EXISTS "WA Blast media admin upload" ON storage.objects;
CREATE POLICY "WA Blast media admin upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wa-blast-media'
  AND public.is_admin_or_above(auth.uid())
);

DROP POLICY IF EXISTS "WA Blast media admin delete" ON storage.objects;
CREATE POLICY "WA Blast media admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wa-blast-media'
  AND public.is_admin_or_above(auth.uid())
);
