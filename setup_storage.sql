INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public_read" ON storage.objects;
CREATE POLICY "public_read" ON storage.objects FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "public_insert" ON storage.objects;
CREATE POLICY "public_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "public_update" ON storage.objects;
CREATE POLICY "public_update" ON storage.objects FOR UPDATE USING (bucket_id = 'images');

DROP POLICY IF EXISTS "public_delete" ON storage.objects;
CREATE POLICY "public_delete" ON storage.objects FOR DELETE USING (bucket_id = 'images');
