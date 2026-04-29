import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { cafes } from "./cafes";

export const eventTypeEnum = pgEnum("event_type", [
  "live_music",
  "open_mic",
  "workshop",
  "comedy_night",
  "gaming",
  "jamming",
]);


export const eventStatusEnum = pgEnum("event_status", [
  "pending",    // Organizer-submitted events awaiting admin approval
  "upcoming",
  "cancelled",
  "completed",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cafeId: uuid("cafe_id").references(() => cafes.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    eventType: eventTypeEnum("event_type").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    ticketPrice: integer("ticket_price"),
    maxTickets: integer("max_tickets"),
    coverImage: text("cover_image"),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    venueMapsUrl: text("venue_maps_url"),
    earlyBirdPrice: integer("early_bird_price"),
    earlyBirdEndsAt: timestamp("early_bird_ends_at", { withTimezone: true }),
    organizerDisplayName: text("organizer_display_name"),
    organizerPhone: text("organizer_phone"),
    organizerInstagramHandle: text("organizer_instagram_handle"),
    venueTba: boolean("venue_tba").notNull().default(false),
    // Marks GoOut Hyd's own curated events — shown with a "GoOut Official" badge publicly
    isGooutOfficial: boolean("is_goout_official").notNull().default(false),
    status: eventStatusEnum("status").notNull().default("upcoming"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("events_slug_idx").on(t.slug),
    index("events_cafe_id_idx").on(t.cafeId),
    index("events_event_type_idx").on(t.eventType),
    index("events_start_time_idx").on(t.startTime),
    index("events_status_idx").on(t.status),
  ],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
