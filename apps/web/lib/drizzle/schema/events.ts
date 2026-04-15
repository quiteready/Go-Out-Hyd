import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
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
]);

export const eventStatusEnum = pgEnum("event_status", [
  "upcoming",
  "cancelled",
  "completed",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    eventType: eventTypeEnum("event_type").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    ticketPrice: integer("ticket_price"),
    coverImage: text("cover_image"),
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
