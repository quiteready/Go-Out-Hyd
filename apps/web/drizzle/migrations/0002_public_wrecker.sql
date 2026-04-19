ALTER TABLE "events" DROP CONSTRAINT "events_cafe_id_cafes_id_fk";
--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "cafe_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_name" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_address" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_maps_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "early_bird_price" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "early_bird_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE set null ON UPDATE no action;