/**
 * Document Chunks Schema
 *
 * Stores text chunks from processed documents along with their vector embeddings.
 *
 * MULTI-MODAL EMBEDDING STRATEGY:
 *
 * We use different embedding models optimized for different content types:
 *
 * TEXT EMBEDDINGS (768 dimensions):
 * - Model: text-embedding-004 (Vertex AI)
 * - Use case: Text-only content (documents, text chunks)
 * - Dimensions: 768 (native dimensions for text-embedding-004)
 * - Compatible with HNSW indexing (under 2000 dimension limit)
 *
 * MULTIMODAL EMBEDDINGS (1408 dimensions):
 * - Model: multimodalembedding@001
 * - Use case: Images, videos, and mixed content
 * - Dimensions: 1408 (native multimodal dimensions)
 *
 * Benefits:
 * - Each model uses its optimal dimension space
 * - Better semantic representation for each content type
 * - Supports future cross-modal search capabilities
 * - HNSW indexing compatible for fast vector search
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  integer,
  jsonb,
  vector,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { documents } from "./documents";

// Embedding dimensions for different content types
export const TEXT_EMBEDDING_DIMENSIONS = 768; // text-embedding-004 (Vertex AI)
export const MULTIMODAL_EMBEDDING_DIMENSIONS = 1408; // multimodalembedding@001

// Content types for metadata discrimination
export const CONTENT_TYPES = {
  VIDEO: "video",
  AUDIO: "audio",
  IMAGE: "image",
  DOCUMENT: "document",
} as const;

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

// Transcript metadata (shared between video and audio)
export interface TranscriptMetadata {
  language: string;
  model: string;
  transcript_timestamp: string;
  has_audio: boolean;
  error: string | null;
}

// Base metadata interface
interface BaseChunkMetadata {
  media_path?: string;
  contextual_text?: string;
}

// Document metadata
export interface DocumentChunkMetadata extends BaseChunkMetadata {
  content_type: typeof CONTENT_TYPES.DOCUMENT;
  page_number?: number;
  chunk_index: number;
  doc_type: string;
}

// Video-specific metadata
export interface VideoChunkMetadata extends BaseChunkMetadata {
  content_type: typeof CONTENT_TYPES.VIDEO;
  segment_index: number;
  start_offset_sec: number;
  end_offset_sec: number;
  duration_sec: number;
  total_segments: number;
  transcript: TranscriptMetadata;
}

// Audio-specific metadata
export interface AudioChunkMetadata extends BaseChunkMetadata {
  content_type: typeof CONTENT_TYPES.AUDIO;
  segment_index: number;
  start_offset_sec: number;
  end_offset_sec: number;
  duration_sec: number;
  total_segments: number;
  transcript: TranscriptMetadata;
}

// Image-specific metadata (simplified - removed fields that are always null)
export interface ImageChunkMetadata extends BaseChunkMetadata {
  content_type: typeof CONTENT_TYPES.IMAGE;
  filename: string;
}

// Discriminated union of all metadata types
export type ChunkMetadata =
  | VideoChunkMetadata
  | AudioChunkMetadata
  | ImageChunkMetadata
  | DocumentChunkMetadata;

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    document_id: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    context: text("context"),
    chunk_index: integer("chunk_index").notNull(),
    metadata: jsonb("metadata").notNull(),
    // Separate embedding columns for different dimension requirements
    text_embedding: vector("text_embedding", {
      dimensions: TEXT_EMBEDDING_DIMENSIONS,
    }),
    multimodal_embedding: vector("multimodal_embedding", {
      dimensions: MULTIMODAL_EMBEDDING_DIMENSIONS,
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_chunks_user_id_idx").on(table.user_id),
    index("document_chunks_document_id_idx").on(table.document_id),
    // Separate indexes for each embedding type
    index("document_chunks_text_embedding_idx").using(
      "hnsw",
      table.text_embedding.op("vector_cosine_ops"),
    ),
    index("document_chunks_multimodal_embedding_idx").using(
      "hnsw",
      table.multimodal_embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const insertDocumentChunkSchema = createInsertSchema(documentChunks);
export const selectDocumentChunkSchema = createSelectSchema(documentChunks);

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

// Type-safe document chunk with properly typed metadata
export type TypedDocumentChunk = Omit<DocumentChunk, "metadata"> & {
  metadata: ChunkMetadata;
};

// Type-safe new document chunk with properly typed metadata
export type NewTypedDocumentChunk = Omit<NewDocumentChunk, "metadata"> & {
  metadata: ChunkMetadata;
};

// Type guards for metadata discrimination
export function isVideoMetadata(
  metadata: ChunkMetadata,
): metadata is VideoChunkMetadata {
  return metadata.content_type === CONTENT_TYPES.VIDEO;
}

export function isAudioMetadata(
  metadata: ChunkMetadata,
): metadata is AudioChunkMetadata {
  return metadata.content_type === CONTENT_TYPES.AUDIO;
}

export function isImageMetadata(
  metadata: ChunkMetadata,
): metadata is ImageChunkMetadata {
  return metadata.content_type === CONTENT_TYPES.IMAGE;
}

export function isDocumentMetadata(
  metadata: ChunkMetadata,
): metadata is DocumentChunkMetadata {
  return metadata.content_type === CONTENT_TYPES.DOCUMENT;
}
