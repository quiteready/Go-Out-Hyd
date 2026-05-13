CREATE TYPE "public"."event_lead_status" AS ENUM('new', 'contacted', 'converted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."event_lead_ticketing_type" AS ENUM('free', 'paid', 'undecided');--> statement-breakpoint
CREATE TABLE "event_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_instagram_handle" text,
	"event_title" text NOT NULL,
	"event_type" text,
	"expected_date_note" text,
	"venue_name" text,
	"area" text,
	"ticketing_type" "event_lead_ticketing_type" DEFAULT 'undecided' NOT NULL,
	"expected_ticket_price" integer,
	"details" text,
	"status" "event_lead_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_leads_status_idx" ON "event_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_leads_created_at_idx" ON "event_leads" USING btree ("created_at");