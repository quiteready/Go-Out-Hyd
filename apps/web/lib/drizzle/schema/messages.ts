import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { conversations } from "./conversations";

export const messageSenderEnum = pgEnum("message_sender", [
  "user",
  "assistant",
]);

export const messageStatusEnum = pgEnum("message_status", ["success", "error"]);

export interface MessageAttachment {
  id: string;
  name: string;
  contentType: string;
  fileSize: number;
  storagePath: string;
  signedUrl: string;
  expiresAt: string;
}

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    sender: messageSenderEnum("sender").notNull(),
    content: text("content").notNull(),
    attachments: jsonb("attachments").$type<MessageAttachment[]>().default([]), // NEW: JSON array of attachments
    status: messageStatusEnum("status").notNull().default("success"), // Track message success/error for error recovery
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("conversation_id_idx").on(table.conversation_id),
    index("messages_attachments_gin_idx").using("gin", table.attachments), // GIN index for JSON queries
    index("messages_status_idx").on(table.status), // Index for efficient status queries
  ],
);

// Drizzle schema types
export type Message = InferSelectModel<typeof messages>;
