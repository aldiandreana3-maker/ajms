INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "News images public read" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Authenticated upload news images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'news-images');
CREATE POLICY "Authenticated update news images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'news-images');
CREATE POLICY "Authenticated delete news images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'news-images');