import { pgTable, timestamp, uuid, text, index } from "drizzle-orm/pg-core";
import { users } from "./users";

// User usage events table - tracks individual user actions for time-window based limits
export const userUsageEvents = pgTable(
  "user_usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    eventType: text("event_type").notNull(), // 'message', 'document_upload'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Index for efficient time window queries
    index("idx_user_usage_events_user_id_type_time").on(
      table.userId,
      table.eventType,
      table.createdAt,
    ),
  ],
);

// Event type constants
export const USAGE_EVENT_TYPES = {
  MESSAGE: "message",
  DOCUMENT_UPLOAD: "document_upload",
} as const;

export type UsageEventType =
  (typeof USAGE_EVENT_TYPES)[keyof typeof USAGE_EVENT_TYPES];
