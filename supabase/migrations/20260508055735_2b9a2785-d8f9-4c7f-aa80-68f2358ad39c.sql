DROP POLICY IF EXISTS "Anyone can view published news" ON public.news;
CREATE POLICY "Public can view published news"
ON public.news FOR SELECT
TO anon, authenticated
USING (status = 'published' OR public.is_staff_or_above(auth.uid()));