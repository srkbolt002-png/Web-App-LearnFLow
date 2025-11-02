-- ============================================
-- Fix Storage Permissions for lesson-videos
-- ============================================
-- RLS is already enabled on storage.objects in Supabase

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their lesson videos" ON storage.objects;

-- Allow authenticated users to upload videos to lesson-videos bucket
CREATE POLICY "Allow authenticated users to upload lesson videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-videos');

-- Allow public read access to lesson videos
CREATE POLICY "Allow public read access to lesson videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-videos');

-- Allow authenticated users to delete lesson videos
CREATE POLICY "Allow authenticated users to delete their lesson videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-videos');

-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%lesson videos%';
