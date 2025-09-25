-- Down migration for: RAG Schema Transformation (0000_spicy_abomination)
-- Generated: 2025-08-31
-- 
-- This file reverses the changes made in 0000_spicy_abomination.sql
-- Review carefully before executing in production
--
-- WARNINGS:
-- - This migration will drop all document-related tables and data
-- - Document chunks, processing jobs, and document metadata will be permanently lost
-- - RAG functionality will be completely removed
-- - Vector embeddings and all document processing history will be deleted
-- - This operation is IRREVERSIBLE - ensure you have backups

-- ==========================================
-- REVERSE INDEX OPERATIONS
-- ==========================================

-- Drop document-related indexes
DROP INDEX IF EXISTS "document_chunks_user_id_idx";
DROP INDEX IF EXISTS "document_chunks_document_id_idx";
DROP INDEX IF EXISTS "document_chunks_text_embedding_idx";
DROP INDEX IF EXISTS "document_chunks_multimodal_embedding_idx";

DROP INDEX IF EXISTS "document_processing_jobs_document_id_idx";
DROP INDEX IF EXISTS "document_processing_jobs_status_idx";
DROP INDEX IF EXISTS "document_processing_jobs_updated_at_idx";
DROP INDEX IF EXISTS "document_processing_jobs_status_updated_at_idx";

DROP INDEX IF EXISTS "documents_user_id_idx";
DROP INDEX IF EXISTS "documents_status_idx";
DROP INDEX IF EXISTS "documents_file_category_idx";
DROP INDEX IF EXISTS "documents_created_at_idx";

-- Drop user and message indexes (these may have been modified)
DROP INDEX IF EXISTS "role_idx";
DROP INDEX IF EXISTS "conversation_id_idx";
DROP INDEX IF EXISTS "messages_attachments_gin_idx";
DROP INDEX IF EXISTS "messages_status_idx";
DROP INDEX IF EXISTS "idx_user_usage_events_user_id_type_time";
DROP INDEX IF EXISTS "idx_user_usage_events_created_at";
DROP INDEX IF EXISTS "idx_user_usage_events_user_id";

-- ==========================================
-- REVERSE FOREIGN KEY CONSTRAINTS
-- ==========================================

-- Drop document-related foreign keys
ALTER TABLE "document_chunks" DROP CONSTRAINT IF EXISTS "document_chunks_user_id_users_id_fk";
ALTER TABLE "document_chunks" DROP CONSTRAINT IF EXISTS "document_chunks_document_id_documents_id_fk";
ALTER TABLE "document_processing_jobs" DROP CONSTRAINT IF EXISTS "document_processing_jobs_document_id_documents_id_fk";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_user_id_users_id_fk";

-- Drop other foreign keys that may need to be recreated
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_user_id_users_id_fk";
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_conversation_id_conversations_id_fk";
ALTER TABLE "user_usage_events" DROP CONSTRAINT IF EXISTS "user_usage_events_user_id_users_id_fk";

-- ==========================================
-- REVERSE TABLE OPERATIONS
-- ==========================================

-- Drop document-related tables (in reverse dependency order)
DROP TABLE IF EXISTS "document_chunks";
DROP TABLE IF EXISTS "document_processing_jobs";
DROP TABLE IF EXISTS "documents";

-- Drop core tables (will need to be recreated with original structure)
-- WARNING: This will delete ALL user data, conversations, and messages
DROP TABLE IF EXISTS "user_usage_events";
DROP TABLE IF EXISTS "messages";
DROP TABLE IF EXISTS "conversations";
DROP TABLE IF EXISTS "users";

-- ==========================================
-- REVERSE ENUM OPERATIONS
-- ==========================================

-- Drop document-related enums
DROP TYPE IF EXISTS "document_processing_job_status";
DROP TYPE IF EXISTS "document_status";
DROP TYPE IF EXISTS "file_category";

-- Drop other enums (will need to be recreated)
DROP TYPE IF EXISTS "message_sender";
DROP TYPE IF EXISTS "message_status";

-- ==========================================
-- MANUAL INTERVENTION REQUIRED
-- ==========================================

-- CRITICAL: This down migration completely removes the RAG schema
-- 
-- After running this migration, you will need to:
-- 1. Restore the original Chat-SaaS schema with ai_models table
-- 2. Recreate conversations table with active_model_id column
-- 3. Recreate messages table with model_id and reasoning columns
-- 4. Restore all user data, conversations, and messages from backup
-- 5. Recreate appropriate indexes and constraints for Chat-SaaS
--
-- BACKUP VERIFICATION REQUIRED:
-- - Verify you have a complete backup of all user data before proceeding
-- - Verify the backup includes: users, conversations, messages, ai_models, user_usage_events
-- - Test restore procedures on a staging environment first
--
-- DATA LOSS WARNING:
-- - ALL documents and document chunks will be permanently deleted
-- - ALL conversation history will be permanently deleted  
-- - ALL user accounts and usage data will be permanently deleted
-- - Vector embeddings and processing metadata cannot be recovered
--
-- This rollback requires manual schema recreation for Chat-SaaS functionality
