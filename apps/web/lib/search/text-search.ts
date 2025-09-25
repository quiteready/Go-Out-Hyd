/**
 * Text Search
 *
 * Performs vector similarity search against text embeddings (768 dimensions) using RPC functions.
 */

import { createClient } from "../supabase/server";
import {
  SearchOptions,
  SearchResult,
  ChunkMetadata,
  RpcSearchResult,
} from "./types";

export async function searchTextChunks(
  queryEmbedding: number[],
  options: SearchOptions,
): Promise<SearchResult[]> {
  const { limit, similarity_threshold, user_id } = options;

  console.log("Searching text chunks via RPC:", {
    embeddingDimensions: queryEmbedding.length,
    limit,
    similarity_threshold,
    user_id,
  });

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Call RPC function - pass embedding as array, not string
    const { data: searchResults, error } = await supabase.rpc(
      "match_text_chunks",
      {
        query_embedding: queryEmbedding, // Pass as array directly
        p_user_id: user_id,
        p_match_threshold: similarity_threshold,
        p_match_count: limit,
      },
    );

    if (error) {
      console.error("RPC text search error:", error);
      throw new Error(`RPC text search failed: ${error.message}`);
    }

    if (!searchResults) {
      console.log("No results from RPC text search");
      return [];
    }

    // Format results to match SearchResult interface
    const formattedResults: SearchResult[] = searchResults.map(
      (result: RpcSearchResult) => ({
        chunk_id: result.chunk_id,
        content: result.content,
        context: result.context,
        similarity: result.similarity,
        embedding_type: "text",
        metadata: result.metadata as ChunkMetadata,
        document_filename: result.document_filename,
        document_id: result.document_id,
      }),
    );

    console.log("Text search completed via RPC:", {
      resultCount: formattedResults.length,
      avgSimilarity:
        formattedResults.length > 0
          ? formattedResults.reduce((sum, r) => sum + r.similarity, 0) /
            formattedResults.length
          : 0,
    });

    formattedResults.forEach((result, idx) => {
      console.log(`Text search result ${idx}:`, {
        content: result.content,
        similarity: result.similarity,
        metadata: result.metadata,
        document_filename: result.document_filename,
        document_id: result.document_id,
      });
    });

    return formattedResults;
  } catch (error) {
    console.error("Text search failed:", error);
    throw new Error(`Text search failed: ${error}`);
  }
}
