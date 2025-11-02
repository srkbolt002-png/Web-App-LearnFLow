-- ============================================
-- SAFE MIGRATION: Fix lesson-videos bucket
-- ============================================
-- This only creates/updates the storage bucket
-- Does NOT touch any existing data or tables
-- Safe to run on existing databases with data

-- Step 1: Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-videos', 
  'lesson-videos', 
  true,  -- Public bucket for easy access
  524288000,  -- 500MB limit per file
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Verify the bucket was created/updated
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'lesson-videos';
