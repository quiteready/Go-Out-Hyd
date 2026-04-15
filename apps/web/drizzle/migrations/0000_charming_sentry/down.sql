-- Down migration for: 0000_charming_sentry
-- Generated: 2026-03-22
--
-- Reverses: 5 tables, 11 indexes, 3 FK constraints, 4 enums
-- WARNING: Running this will permanently delete ALL GoOut Hyd data.
-- Take a database backup before executing in any non-development environment.

-- ==========================================
-- REVERSE INDEX OPERATIONS
-- ==========================================

DROP INDEX IF EXISTS "menu_items_cafe_id_idx";
DROP INDEX IF EXISTS "events_status_idx";
DROP INDEX IF EXISTS "events_start_time_idx";
DROP INDEX IF EXISTS "events_event_type_idx";
DROP INDEX IF EXISTS "events_cafe_id_idx";
DROP INDEX IF EXISTS "events_slug_idx";
DROP INDEX IF EXISTS "cafes_status_idx";
DROP INDEX IF EXISTS "cafes_area_idx";
DROP INDEX IF EXISTS "cafes_slug_idx";
DROP INDEX IF EXISTS "cafe_leads_created_at_idx";
DROP INDEX IF EXISTS "cafe_leads_status_idx";
DROP INDEX IF EXISTS "cafe_images_cafe_id_idx";

-- ==========================================
-- REVERSE FK CONSTRAINTS
-- ==========================================

ALTER TABLE "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_cafe_id_cafes_id_fk";
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_cafe_id_cafes_id_fk";
ALTER TABLE "cafe_images" DROP CONSTRAINT IF EXISTS "cafe_images_cafe_id_cafes_id_fk";

-- ==========================================
-- REVERSE TABLE OPERATIONS (children first, then parent)
-- ==========================================

-- WARNING: All menu items data will be permanently deleted
DROP TABLE IF EXISTS "menu_items";

-- WARNING: All events data will be permanently deleted
DROP TABLE IF EXISTS "events";

-- WARNING: All cafe images data will be permanently deleted
DROP TABLE IF EXISTS "cafe_images";

-- WARNING: All partner leads data will be permanently deleted
DROP TABLE IF EXISTS "cafe_leads";

-- WARNING: All cafe data will be permanently deleted
DROP TABLE IF EXISTS "cafes";

-- ==========================================
-- REVERSE ENUM OPERATIONS
-- ==========================================

DROP TYPE IF EXISTS "public"."event_type";
DROP TYPE IF EXISTS "public"."event_status";
DROP TYPE IF EXISTS "public"."cafe_status";
DROP TYPE IF EXISTS "public"."lead_status";
