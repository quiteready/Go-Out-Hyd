/**
 * Search Result Combiner
 *
 * Combines and ranks results from both text and multimodal searches.
 */

import { SearchResult, SearchResultsDict, CombinedSearchResult } from "./types";

/**
 * Combine and rank results from the search results dictionary
 */
export function combineAndRankResults(
  searchResults: SearchResultsDict,
  maxResults: number = 10,
): CombinedSearchResult {
  console.log("📊 Search results received:", {
    textCount: searchResults["text"]?.length || 0,
    textMultimodalCount: searchResults["text-multimodal"]?.length || 0,
    imageMultimodalCount: searchResults["image-multimodal"]?.length || 0,
  });

  // Extract results from the dictionary
  const textResults = searchResults["text"] || [];
  const multimodalResults = [
    ...(searchResults["text-multimodal"] || []),
    ...(searchResults["image-multimodal"] || []),
  ];

  console.log("Extracted results:", {
    textResults: textResults.length,
    multimodalResults: multimodalResults.length,
  });

  // Strategy: Take top results from each embedding type separately
  // This ensures balanced representation regardless of similarity score scales

  const maxPerType = Math.floor(maxResults / 2); // 5 for each type when maxResults = 10

  // Sort and take top results from each type separately
  const topTextResults = textResults
    .sort((a: SearchResult, b: SearchResult) => b.similarity - a.similarity)
    .slice(0, maxPerType);

  const topMultimodalResults = multimodalResults
    .sort((a: SearchResult, b: SearchResult) => b.similarity - a.similarity)
    .slice(0, maxPerType);

  // Remove duplicates based on chunk_id (if a chunk appears in both searches)
  const uniqueResults = new Map<string, SearchResult>();

  // Add text results first
  for (const result of topTextResults) {
    uniqueResults.set(result.chunk_id, result);
  }

  // Add multimodal results, keeping higher similarity if duplicate
  for (const result of topMultimodalResults) {
    const existingResult = uniqueResults.get(result.chunk_id);
    if (!existingResult) {
      // First time seeing this chunk
      uniqueResults.set(result.chunk_id, result);
    } else {
      // Chunk already exists, keep the one with higher similarity
      if (result.similarity > existingResult.similarity) {
        uniqueResults.set(result.chunk_id, result);
      }
    }
  }

  // Convert back to array - maintain the balance by interleaving
  const combinedResults = Array.from(uniqueResults.values());

  // Calculate statistics
  const textResultsCount = combinedResults.filter(
    (r) => r.embedding_type === "text",
  ).length;
  const multimodalResultsCount = combinedResults.filter(
    (r) => r.embedding_type === "multimodal",
  ).length;

  console.log("Combined search results:", {
    totalResults: combinedResults.length,
    textResultsCount,
    multimodalResultsCount,
  });

  return {
    results: combinedResults,
    total_results: combinedResults.length,
    text_results_count: textResultsCount,
    multimodal_results_count: multimodalResultsCount,
  };
}
