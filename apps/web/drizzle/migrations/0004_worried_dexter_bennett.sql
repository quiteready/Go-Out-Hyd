-- Custom migration: Create RLS policies for chat-images storage bucket
-- This migration sets up Row Level Security policies for the chat-images bucket
-- to ensure users can only access their own uploaded images
-- File path structure: images/{userId}/{filename}
-- So userId is at folder index [2]

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
   bucket_id = 'chat-images' AND
   auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 2: Users can view their own images
CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT TO authenticated
USING (
   bucket_id = 'chat-images' AND
   auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 3: Users can delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE TO authenticated
USING (
   bucket_id = 'chat-images' AND
   auth.uid()::text = (storage.foldername(name))[2]
);
