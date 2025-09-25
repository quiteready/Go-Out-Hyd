/**
 * Search Types
 *
 * Types for the dual embedding search system that supports both text and multimodal embeddings.
 */

export interface SearchOptions {
  limit: number;
  similarity_threshold: number;
  user_id: string;
}

export interface SearchResult {
  chunk_id: string;
  content: string;
  context?: string;
  similarity: number;
  embedding_type: "text" | "multimodal";
  metadata: ChunkMetadata;
  document_filename: string;
  document_id: string;
}

export interface SearchResultsDict {
  text?: SearchResult[];
  "text-multimodal"?: SearchResult[];
  "image-multimodal"?: SearchResult[];
}

export interface CombinedSearchResult {
  results: SearchResult[];
  total_results: number;
  text_results_count: number;
  multimodal_results_count: number;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  similarity_threshold?: number;
  content_types?: ContentType[];
}

// RPC-specific types for database function calls
export interface RpcSearchResult {
  chunk_id: string;
  document_id: string;
  content: string;
  context?: string;
  similarity: number;
  metadata: ChunkMetadata;
  document_filename: string;
  created_at: string;
}

export interface RpcSearchOptions {
  user_id: string;
  match_threshold?: number;
  match_count?: number;
  content_types?: ContentType[];
}

// Re-export types from document chunks schema
export type ContentType = "video" | "audio" | "image" | "document";
export type ChunkMetadata = Record<string, unknown>; // Generic metadata object
