import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  index,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

export const documentStatusEnum = pgEnum("document_status", [
  "uploading",
  "processing",
  "completed",
  "error",
]);

export const fileCategoryEnum = pgEnum("file_category", [
  "documents",
  "images",
  "videos",
  "audio",
]);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    filename: text("filename").notNull(),
    original_filename: text("original_filename").notNull(),
    file_size: integer("file_size").notNull(),
    mime_type: text("mime_type").notNull(),
    file_category: fileCategoryEnum("file_category").notNull(),
    gcs_bucket: text("gcs_bucket").notNull(),
    gcs_path: text("gcs_path").notNull(),
    status: documentStatusEnum("status").notNull().default("uploading"),
    chunk_count: integer("chunk_count").default(0),
    processing_error: text("processing_error"),
    processing_metadata: text("processing_metadata"), // JSON string for processing results
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processed_at: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("documents_user_id_idx").on(table.user_id),
    index("documents_status_idx").on(table.status),
    index("documents_file_category_idx").on(table.file_category),
    index("documents_created_at_idx").on(table.created_at),
    unique("documents_gcs_path_unique").on(table.gcs_path),
  ],
);

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type FileCategory = (typeof fileCategoryEnum.enumValues)[number];
