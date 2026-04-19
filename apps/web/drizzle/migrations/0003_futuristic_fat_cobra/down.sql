-- Down migration for: 0003_futuristic_fat_cobra
-- Generated: 2026-04-20
--
-- This file reverses the changes made in 0003_futuristic_fat_cobra.sql
-- Review carefully before executing in production
--
-- WARNINGS:
-- - Dropping organizer_display_name, organizer_phone, organizer_instagram_handle
--   will permanently delete any data stored in those columns.

-- ==========================================
-- REVERSE COLUMN OPERATIONS
-- ==========================================

ALTER TABLE "events" DROP COLUMN IF EXISTS "organizer_instagram_handle";
ALTER TABLE "events" DROP COLUMN IF EXISTS "organizer_phone";
ALTER TABLE "events" DROP COLUMN IF EXISTS "organizer_display_name";
