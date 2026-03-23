
-- Allow authenticated users to upload attendance photos to kepenghunian-files bucket
CREATE POLICY "Staff can upload attendance photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kepenghunian-files' 
  AND (storage.foldername(name))[1] = 'attendance'
  AND is_staff_or_above(auth.uid())
);

-- Allow reading attendance photos
CREATE POLICY "Staff can view attendance photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kepenghunian-files' 
  AND (storage.foldername(name))[1] = 'attendance'
  AND is_staff_or_above(auth.uid())
);
