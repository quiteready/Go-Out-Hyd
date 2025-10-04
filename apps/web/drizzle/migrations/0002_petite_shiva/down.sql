-- Down migration for: 0002_petite_shiva (RPC Functions)
-- Generated: 2024-10-03
--
-- This file reverses the RPC functions for vector search
-- Review carefully before executing in production
-- ==========================================
-- REVERSE FUNCTION OPERATIONS
-- ==========================================
-- Reverse: CREATE FUNCTION match_multimodal_chunks
DROP FUNCTION IF EXISTS match_multimodal_chunks (vector, uuid, double precision, integer);

-- Reverse: CREATE FUNCTION match_text_chunks
DROP FUNCTION IF EXISTS match_text_chunks (vector, uuid, double precision, integer);
