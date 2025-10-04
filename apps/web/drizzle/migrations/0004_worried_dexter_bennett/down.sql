-- Down migration for: 0004_worried_dexter_bennett (Storage RLS Policies)
-- Generated: 2024-10-03
--
-- This file reverses the storage RLS policies for chat-images bucket
-- Review carefully before executing in production
-- ==========================================
-- REVERSE STORAGE POLICY OPERATIONS
-- ==========================================
-- Reverse: CREATE POLICY "Users can delete own images"
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Reverse: CREATE POLICY "Users can view own images"
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;

-- Reverse: CREATE POLICY "Users can upload own images"
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
