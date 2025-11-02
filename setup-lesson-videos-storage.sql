-- ============================================
-- Complete Setup for lesson-videos Storage
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- This will create the bucket and set up all necessary policies

-- Step 1: Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-videos', 
  'lesson-videos', 
  true,
  524288000,  -- 500MB limit per file
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to lesson videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their lesson videos" ON storage.objects;

-- Step 3: Create policies for lesson-videos bucket
CREATE POLICY "Allow authenticated users to upload lesson videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-videos');

CREATE POLICY "Allow public read access to lesson videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-videos');

CREATE POLICY "Allow authenticated users to delete their lesson videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-videos');

-- Step 4: Verify setup (optional - you can run this to check)
SELECT 
  'Bucket Status:' as info,
  id, 
  name, 
  public, 
  file_size_limit 
FROM storage.buckets 
WHERE id = 'lesson-videos';

SELECT 
  'Policies Status:' as info,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%lesson videos%';
