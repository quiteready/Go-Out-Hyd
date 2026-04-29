-- Down migration for: 0004_empty_captain_marvel
-- Reverses: event organizer platform foundation schema additions
--
-- WARNINGS:
-- - The 'pending' value added to event_status enum CANNOT be removed in PostgreSQL
--   without dropping and recreating the entire enum type. This is a known PostgreSQL
--   limitation. If rollback is needed, you must manually handle any rows with
--   status = 'pending' before attempting enum recreation.
-- - The 'jamming' value added to event_type enum has the same irreversibility.
-- - Dropping venue_tba and is_goout_official columns will permanently delete
--   any data stored in those columns.

-- ==========================================
-- REVERSE COLUMN OPERATIONS (last added, first dropped)
-- ==========================================

-- Reverse: ALTER TABLE "events" ADD COLUMN "is_goout_official"
ALTER TABLE "events" DROP COLUMN IF EXISTS "is_goout_official";

-- Reverse: ALTER TABLE "events" ADD COLUMN "venue_tba"
ALTER TABLE "events" DROP COLUMN IF EXISTS "venue_tba";

-- ==========================================
-- REVERSE ENUM OPERATIONS — MANUAL INTERVENTION REQUIRED
-- ==========================================

-- CANNOT AUTOMATICALLY REVERSE:
-- ALTER TYPE "public"."event_status" ADD VALUE 'pending'
-- ALTER TYPE "public"."event_type" ADD VALUE 'jamming'
--
-- PostgreSQL does not support removing values from an enum type.
-- To fully reverse this migration, you would need to:
--   1. Ensure zero rows have status = 'pending' or event_type = 'jamming'
--   2. CREATE a new enum type without the unwanted values
--   3. ALTER TABLE events ALTER COLUMN status TYPE new_enum USING ...
--   4. DROP the old enum type
--   5. RENAME the new enum type to the original name
--
-- This is a destructive multi-step process. Take a full database backup
-- before attempting. In practice, accept 'pending' and 'jamming' as
-- permanent additions to these enums.
