-- Create private bucket for kepenghunian uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('kepenghunian-files', 'kepenghunian-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policies on storage.objects for kepenghunian-files bucket
CREATE POLICY "kepenghunian_files_select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kepenghunian-files'
  AND (
    public.is_staff_or_above(auth.uid())
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "kepenghunian_files_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kepenghunian-files'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "kepenghunian_files_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'kepenghunian-files'
  AND (
    public.is_staff_or_above(auth.uid())
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'kepenghunian-files'
);

CREATE POLICY "kepenghunian_files_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'kepenghunian-files'
  AND (
    public.is_staff_or_above(auth.uid())
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);