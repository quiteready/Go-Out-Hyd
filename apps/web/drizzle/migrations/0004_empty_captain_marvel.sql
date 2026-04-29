ALTER TYPE "public"."event_status" ADD VALUE 'pending' BEFORE 'upcoming';--> statement-breakpoint
ALTER TYPE "public"."event_type" ADD VALUE 'jamming';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_tba" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_goout_official" boolean DEFAULT false NOT NULL;