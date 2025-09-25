/**
 * Embedding Types
 *
 * Shared types for embedding generation that match the RAG processor's capabilities.
 */

export const TEXT_EMBEDDING_DIMENSIONS = 768; // text-embedding-004
export const MULTIMODAL_EMBEDDING_DIMENSIONS = 1408; // multimodal-embedding-001

export const EMBEDDING_TYPES = {
  TEXT: "text",
  MULTIMODAL: "multimodal",
} as const;

export type EmbeddingType =
  (typeof EMBEDDING_TYPES)[keyof typeof EMBEDDING_TYPES];

export class EmbeddingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingServiceError";
  }
}

export interface TextEmbeddingOptions {
  taskType?: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" | "SEMANTIC_SIMILARITY";
  outputDimensionality?: number;
}

export interface MultimodalEmbeddingOptions {
  contextualText?: string;
  dimension?: number;
}

export interface BatchEmbeddingOptions {
  maxConcurrent?: number;
  taskType?: TextEmbeddingOptions["taskType"];
}
