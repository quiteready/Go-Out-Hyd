CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'converted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."cafe_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('upcoming', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('live_music', 'open_mic', 'workshop', 'comedy_night', 'gaming');--> statement-breakpoint
CREATE TABLE "cafe_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafe_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_name" text NOT NULL,
	"cafe_name" text NOT NULL,
	"phone" text NOT NULL,
	"area" text NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"area" text NOT NULL,
	"description" text,
	"cover_image" text,
	"phone" text,
	"instagram_handle" text,
	"google_maps_url" text,
	"address" text,
	"opening_hours" text,
	"status" "cafe_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cafes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"event_type" "event_type" NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"ticket_price" integer,
	"cover_image" text,
	"status" "event_status" DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"description" text,
	"is_available" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cafe_images" ADD CONSTRAINT "cafe_images_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cafe_images_cafe_id_idx" ON "cafe_images" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "cafe_leads_status_idx" ON "cafe_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cafe_leads_created_at_idx" ON "cafe_leads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cafes_slug_idx" ON "cafes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cafes_area_idx" ON "cafes" USING btree ("area");--> statement-breakpoint
CREATE INDEX "cafes_status_idx" ON "cafes" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_cafe_id_idx" ON "events" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX "events_event_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "events_start_time_idx" ON "events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "menu_items_cafe_id_idx" ON "menu_items" USING btree ("cafe_id");