-- Down migration for 0001_breezy_peter_quill
-- Reverses: tickets table, ticket_status enum, max_tickets column on events

DROP INDEX IF EXISTS "tickets_customer_email_idx";
DROP INDEX IF EXISTS "tickets_status_idx";
DROP INDEX IF EXISTS "tickets_event_id_idx";
DROP INDEX IF EXISTS "tickets_ticket_code_idx";
DROP INDEX IF EXISTS "tickets_razorpay_order_id_idx";

DROP TABLE IF EXISTS "tickets";

DROP TYPE IF EXISTS "public"."ticket_status";

ALTER TABLE "events" DROP COLUMN IF EXISTS "max_tickets";
