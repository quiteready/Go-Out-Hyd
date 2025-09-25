/**
 * RAG Search Service
 *
 * Performs simplified multimodal RAG search with two simple checks:
 * 1. Text exists → Text RAG search + Multimodal RAG search (using text)
 * 2. Images exist → Multimodal RAG search (using images)
 */

import { getTextEmbeddingService } from "../embeddings/text-embeddings";
import { searchTextChunks } from "../search/text-search";
import { searchMultimodalChunks } from "../search/multimodal-search";
import { combineAndRankResults } from "../search/search-combiner";
import { EmbeddingServiceError } from "../embeddings/types";
import type {
  SearchOptions,
  SearchResult,
  SearchResultsDict,
} from "../search/types";
import { getMultimodalEmbeddingService } from "../embeddings/multimodal-embeddings";

export interface RAGSearchOptions {
  limit?: number;
  similarity_threshold?: number;
}

export interface RAGSearchResult {
  context: string;
  sources: Array<{
    document_filename: string;
    chunk_id: string;
    similarity: number;
    embedding_type: "text" | "multimodal";
  }>;
  total_results: number;
  text_results_count: number;
  multimodal_results_count: number;
}

/**
 * Fetch actual image data from URL for visual content processing
 */
async function fetchImageData(
  url: string,
): Promise<{ data: string; mimeType: string }> {
  try {
    console.log(
      "📥 Fetching image data from URL:",
      url.substring(0, 100) + "...",
    );

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";

    console.log("✅ Image data fetched successfully:", {
      mimeType,
      sizeKB: Math.round(arrayBuffer.byteLength / 1024),
    });

    return { data: base64Data, mimeType };
  } catch (error) {
    console.error("❌ Failed to fetch image data:", error);
    throw new Error(
      `Image fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Perform text-based search (both text and multimodal embeddings from text)
 */
async function searchText(
  userText: string,
  searchOptions: SearchOptions,
): Promise<Pick<SearchResultsDict, "text" | "text-multimodal">> {
  if (!userText || userText.trim().length === 0) {
    return {};
  }

  console.log("✅ Text found - generating text and multimodal embeddings");

  try {
    // Text embedding + Multimodal embedding (from text)
    const [textEmbedding, multimodalEmbedding] = await Promise.all([
      getTextEmbeddingService().generateTextEmbedding(
        userText,
        "RETRIEVAL_QUERY",
      ),
      getMultimodalEmbeddingService().generateMultimodalEmbedding(userText),
    ]);
    console.log("✅ Text and multimodal embedding (from text) generated");

    // Text search + Multimodal search (from text)
    const [textResults, multimodalResults] = await Promise.all([
      searchTextChunks(textEmbedding, searchOptions),
      searchMultimodalChunks(multimodalEmbedding, searchOptions),
    ]);
    console.log(`✅ Text search completed (${textResults.length} results)`);
    console.log(
      `✅ Multimodal search (from text) completed (${multimodalResults.length} results)`,
    );

    return {
      text: textResults,
      "text-multimodal": multimodalResults,
    };
  } catch (error) {
    console.error("❌ Text search failed - propagating error:", error);
    // Let multimodal embedding errors propagate up instead of silent fallback
    throw error;
  }
}

/**
 * Perform image-based search (multimodal embeddings from images)
 */
async function searchImages(
  images: Array<{ name: string; url: string }>,
  searchOptions: SearchOptions,
): Promise<Pick<SearchResultsDict, "image-multimodal">> {
  if (!images || images.length === 0) {
    return {};
  }

  console.log(`✅ ${images.length} image(s) found - processing visual content`);

  const imageSearchPromises = images.map(
    async (image, index): Promise<SearchResult[]> => {
      try {
        console.log(
          `✅ Processing image ${index + 1}/${images.length}: ${image.name}`,
        );

        const imageData = await fetchImageData(image.url);
        const embedding =
          await getMultimodalEmbeddingService().generateImageEmbedding(
            imageData,
          );
        console.log(`✅ Image embedding generated for: ${image.name}`);

        const results = await searchMultimodalChunks(embedding, searchOptions);
        console.log(
          `✅ Image search completed for ${image.name} (${results.length} results)`,
        );

        return results;
      } catch (error) {
        console.warn(`❌ Image search failed for ${image.name}:`, error);
        return [];
      }
    },
  );

  const allImageResults = await Promise.all(imageSearchPromises);

  return {
    "image-multimodal": allImageResults.flat(), // flatten the array of arrays into a single array
  };
}

/**
 * Simplified RAG search with two checks:
 * Check 1: Text exists → Text embedding search + Multimodal embedding search (using text)
 * Check 2: Images exist → Multimodal embedding search (using images)
 */
export async function searchForRAGContext(
  userText: string,
  images: Array<{ name: string; url: string }>,
  userId: string,
): Promise<RAGSearchResult> {
  const limit = 5;
  const similarity_threshold = 0.5;

  console.log("🔍 Starting RAG search:", {
    hasText: !!userText.trim(),
    hasImages: images.length > 0,
    textLength: userText.length,
    imageCount: images.length,
  });

  const searchOptions: SearchOptions = {
    limit,
    similarity_threshold,
    user_id: userId,
  };

  try {
    // Early return for empty input
    if (userText.trim() === "" && images.length === 0) {
      console.log("⚠️ No text or images provided - returning empty results");
      return {
        context: "",
        sources: [],
        total_results: 0,
        text_results_count: 0,
        multimodal_results_count: 0,
      };
    }

    // Run text and image searches concurrently
    console.log("⏳ Starting text and image searches...");
    const [textSearchResults, imageSearchResults] = await Promise.all([
      searchText(userText, searchOptions),
      searchImages(images, searchOptions),
    ]);

    // Combine all search results into a single dictionary
    const allSearchResults: SearchResultsDict = {
      ...textSearchResults,
      ...imageSearchResults,
    };

    // Check if we have any results
    const hasAnyResults = Object.values(allSearchResults).some(
      (results) => results && results.length > 0,
    );

    if (!hasAnyResults) {
      console.log("⚠️ No search results found - returning empty results");
      return {
        context: "",
        sources: [],
        total_results: 0,
        text_results_count: 0,
        multimodal_results_count: 0,
      };
    }

    // Combine and rank results using the combiner
    const combinedResults = combineAndRankResults(allSearchResults, limit);

    // Format context and sources
    const context = formatSearchResultsAsContext(combinedResults.results);
    const sources = combinedResults.results.map((result) => ({
      document_filename: result.document_filename,
      chunk_id: result.chunk_id,
      similarity: result.similarity,
      embedding_type: result.embedding_type,
    }));

    const ragResult: RAGSearchResult = {
      context,
      sources,
      total_results: combinedResults.total_results,
      text_results_count: combinedResults.text_results_count,
      multimodal_results_count: combinedResults.multimodal_results_count,
    };

    console.log("✅ RAG context generated:", {
      contextLength: context.length,
      sourcesCount: sources.length,
      totalResults: ragResult.total_results,
    });

    return ragResult;
  } catch (error) {
    console.error("💥 RAG search failed:", error);

    // Return empty context instead of throwing - chat should continue even without RAG
    if (error instanceof EmbeddingServiceError) {
      console.warn(
        "Embedding service error, continuing without RAG context:",
        error.message,
      );
    }

    return {
      context: "",
      sources: [],
      total_results: 0,
      text_results_count: 0,
      multimodal_results_count: 0,
    };
  }
}

/**
 * Format search results as context text for the LLM
 * Includes both content (transcription) and context (visual descriptions) for comprehensive multimodal RAG
 */
function formatSearchResultsAsContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  // Create source information for each result
  const formattedContext = results
    .map((result) => {
      const sourceInfo = `Document: ${result.document_filename}, Similarity: ${result.similarity.toFixed(3)}`;
      const content = result.content;
      const context = result.context ? `\nContext: ${result.context}` : "";
      return `[${sourceInfo}]\n${content}${context}`;
    })
    .join("\n\n");

  return `<RELEVANT_CONTEXT>\n${formattedContext}\n</RELEVANT_CONTEXT>`;
}
