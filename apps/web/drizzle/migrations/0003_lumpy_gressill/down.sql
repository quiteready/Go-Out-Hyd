-- Down migration for: 0003_lumpy_gressill (Document Timeout Cleanup)
-- Generated: 2024-10-03
--
-- This file reverses the document timeout cleanup job
-- Review carefully before executing in production
-- ==========================================
-- REVERSE CRON JOB OPERATIONS
-- ==========================================
-- Reverse: Schedule cleanup job
-- Remove document timeout cleanup job
SELECT
    cron.unschedule ('cleanup-stuck-documents');
