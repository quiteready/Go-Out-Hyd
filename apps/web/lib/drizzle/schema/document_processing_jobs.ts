import {
  pgTable,
  pgEnum,
  uuid,
  integer,
  text,
  timestamp,
  bigint,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const documentProcessingJobStatusEnum = pgEnum(
  "document_processing_job_status",
  [
    "pending",
    "processing",
    "processed",
    "error",
    "retry_pending",
    "cancelled",
    "partially_processed",
  ],
);

// Processing stages for better progress tracking
export const PROCESSING_STAGES = {
  PENDING: "pending",
  DOWNLOADING: "downloading",
  ANALYZING: "analyzing",
  SPLITTING: "splitting",
  TRANSCRIBING: "transcribing", // for audio/video
  PARSING: "parsing", // for documents
  EMBEDDING: "embedding",
  SAVING: "saving",
  COMPLETED: "completed",
} as const;

export type ProcessingStage =
  (typeof PROCESSING_STAGES)[keyof typeof PROCESSING_STAGES];

export const documentProcessingJobs = pgTable(
  "document_processing_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Reference to the document being processed
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    // Job status and progress tracking
    status: documentProcessingJobStatusEnum("status")
      .default("pending")
      .notNull(),

    // Stage-based progress tracking (more reliable than percentages)
    processingStage: text("processing_stage").default("pending").notNull(),

    // File metadata for processing estimates
    fileSize: bigint("file_size", { mode: "number" }),
    fileType: text("file_type").notNull(),
    filePath: text("file_path").notNull(),

    // Simple retry logic
    retryCount: integer("retry_count").default(0).notNull(),

    // Simple error handling
    errorMessage: text("error_message"),

    // Timing information
    processingStartedAt: timestamp("processing_started_at", {
      withTimezone: true,
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Audit fields
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Critical index for JOIN operations
    index("document_processing_jobs_document_id_idx").on(table.documentId),
    // Index for status filtering
    index("document_processing_jobs_status_idx").on(table.status),
    // Index for ordering by updated_at
    index("document_processing_jobs_updated_at_idx").on(table.updatedAt),
    // Composite index for status + updated_at queries
    index("document_processing_jobs_status_updated_at_idx").on(
      table.status,
      table.updatedAt,
    ),
    // Unique constraint on file path for idempotent operations
    unique("document_processing_jobs_file_path_unique").on(table.filePath),
  ],
);

// Helper function to calculate overall progress
export function calculateOverallProgress(
  currentStage: number,
  totalStages: number,
  stageProgress: number,
): number {
  const stageWeight = 100 / totalStages;
  const completedStages = currentStage * stageWeight;
  const currentStageContribution = (stageProgress / 100) * stageWeight;
  return Math.round(completedStages + currentStageContribution);
}

// Stage configurations for different file types
export const STAGE_CONFIGS = {
  video: [
    PROCESSING_STAGES.DOWNLOADING,
    PROCESSING_STAGES.ANALYZING,
    PROCESSING_STAGES.SPLITTING,
    PROCESSING_STAGES.TRANSCRIBING,
    PROCESSING_STAGES.EMBEDDING,
    PROCESSING_STAGES.SAVING,
  ],
  audio: [
    PROCESSING_STAGES.DOWNLOADING,
    PROCESSING_STAGES.ANALYZING,
    PROCESSING_STAGES.SPLITTING,
    PROCESSING_STAGES.TRANSCRIBING,
    PROCESSING_STAGES.EMBEDDING,
    PROCESSING_STAGES.SAVING,
  ],
  document: [
    PROCESSING_STAGES.DOWNLOADING,
    PROCESSING_STAGES.PARSING,
    PROCESSING_STAGES.SPLITTING,
    PROCESSING_STAGES.EMBEDDING,
    PROCESSING_STAGES.SAVING,
  ],
  image: [
    PROCESSING_STAGES.DOWNLOADING,
    PROCESSING_STAGES.ANALYZING,
    PROCESSING_STAGES.EMBEDDING,
    PROCESSING_STAGES.SAVING,
  ],
} as const;

export type DocumentProcessingJob = typeof documentProcessingJobs.$inferSelect;
export type NewDocumentProcessingJob =
  typeof documentProcessingJobs.$inferInsert;
