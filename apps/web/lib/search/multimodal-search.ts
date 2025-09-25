/**
 * Multimodal Search
 *
 * Performs vector similarity search against multimodal embeddings (1408 dimensions) using RPC functions.
 */

import { createClient } from "../supabase/server";
import {
  SearchOptions,
  SearchResult,
  ChunkMetadata,
  RpcSearchResult,
} from "./types";

export async function searchMultimodalChunks(
  queryEmbedding: number[],
  options: SearchOptions,
): Promise<SearchResult[]> {
  const { limit, similarity_threshold, user_id } = options;

  console.log("Searching multimodal chunks via RPC:", {
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
      "match_multimodal_chunks",
      {
        query_embedding: queryEmbedding, // Pass as array directly
        p_user_id: user_id,
        p_match_threshold: similarity_threshold,
        p_match_count: limit,
      },
    );

    if (error) {
      console.error("RPC multimodal search error:", error);
      throw new Error(`RPC multimodal search failed: ${error.message}`);
    }

    if (!searchResults) {
      console.log("No results from RPC multimodal search");
      return [];
    }

    // Format results to match SearchResult interface
    const formattedResults: SearchResult[] = searchResults.map(
      (result: RpcSearchResult) => ({
        chunk_id: result.chunk_id,
        content: result.content,
        context: result.context,
        similarity: result.similarity,
        embedding_type: "multimodal",
        metadata: result.metadata as ChunkMetadata,
        document_filename: result.document_filename,
        document_id: result.document_id,
      }),
    );

    console.log("Multimodal search completed via RPC:", {
      resultCount: formattedResults.length,
      avgSimilarity:
        formattedResults.length > 0
          ? formattedResults.reduce((sum, r) => sum + r.similarity, 0) /
            formattedResults.length
          : 0,
    });

    formattedResults.forEach((result, idx) => {
      console.log(`Multimodal search result ${idx}:`, {
        content: result.content,
        similarity: result.similarity,
        metadata: result.metadata,
        document_filename: result.document_filename,
        document_id: result.document_id,
      });
    });

    return formattedResults;
  } catch (error) {
    console.error("Multimodal search failed:", error);
    throw new Error(`Multimodal search failed: ${error}`);
  }
}
