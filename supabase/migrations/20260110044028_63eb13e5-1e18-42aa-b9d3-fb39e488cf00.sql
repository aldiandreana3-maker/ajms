-- Create storage bucket for packages photos
INSERT INTO storage.buckets (id, name, public) VALUES ('packages', 'packages', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for packages bucket
CREATE POLICY "Anyone can view package photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'packages');

CREATE POLICY "Staff can upload package photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'packages' AND
  (
    public.is_admin_or_above(auth.uid()) OR
    public.is_staff_or_above(auth.uid())
  )
);

CREATE POLICY "Staff can update package photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'packages' AND
  (
    public.is_admin_or_above(auth.uid()) OR
    public.is_staff_or_above(auth.uid())
  )
);

CREATE POLICY "Staff can delete package photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'packages' AND
  (
    public.is_admin_or_above(auth.uid()) OR
    public.is_staff_or_above(auth.uid())
  )
);