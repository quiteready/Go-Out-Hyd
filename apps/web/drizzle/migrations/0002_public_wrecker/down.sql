-- Down migration for: 0002_public_wrecker
-- Generated: 2026-04-19
--
-- This file reverses the changes made in 0002_public_wrecker.sql
-- Review carefully before executing in production
--
-- WARNINGS:
-- - Restoring NOT NULL on events.cafe_id will FAIL if any rows exist where cafe_id IS NULL.
--   The guard below raises an exception so the rollback aborts cleanly instead of corrupting state.
--   To proceed, either re-link those events to cafes or delete them BEFORE running this rollback.
-- - Restoring ON DELETE CASCADE means deleting a cafe will again cascade-delete its events
--   (and, via the existing tickets FK, all associated tickets). Confirm this is desired before running.
-- - Dropping venue_name / venue_address / venue_maps_url / early_bird_price / early_bird_ends_at
--   will permanently delete any data stored in those columns.

-- ==========================================
-- SAFETY GUARD: Abort if any events lack a cafe
-- ==========================================

DO $$
DECLARE
  orphan_count integer;
BEGIN
  SELECT COUNT(*) INTO orphan_count FROM "events" WHERE "cafe_id" IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION
      'Cannot restore NOT NULL on events.cafe_id: % event row(s) have NULL cafe_id. Re-link or delete them before rolling back.',
      orphan_count;
  END IF;
END $$;

-- ==========================================
-- REVERSE FOREIGN KEY (ON DELETE SET NULL -> ON DELETE CASCADE)
-- ==========================================

ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_cafe_id_cafes_id_fk";

ALTER TABLE "events"
  ADD CONSTRAINT "events_cafe_id_cafes_id_fk"
  FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- ==========================================
-- REVERSE COLUMN OPERATIONS (added columns -> drop)
-- ==========================================

ALTER TABLE "events" DROP COLUMN IF EXISTS "early_bird_ends_at";
ALTER TABLE "events" DROP COLUMN IF EXISTS "early_bird_price";
ALTER TABLE "events" DROP COLUMN IF EXISTS "venue_maps_url";
ALTER TABLE "events" DROP COLUMN IF EXISTS "venue_address";
ALTER TABLE "events" DROP COLUMN IF EXISTS "venue_name";

-- ==========================================
-- REVERSE NULLABILITY (DROP NOT NULL -> SET NOT NULL)
-- ==========================================

ALTER TABLE "events" ALTER COLUMN "cafe_id" SET NOT NULL;
