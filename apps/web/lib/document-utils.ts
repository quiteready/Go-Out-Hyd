import { DocumentWithProcessingJob } from "@/lib/documents";

/**
 * Convert MIME type to content type for document categorization
 */
export function getContentTypeFromMimeType(
  mimeType: string,
): "document" | "video" | "audio" | "image" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  // Default to document for text, pdf, office files, etc.
  return "document";
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format date in human readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format polling time as relative time (e.g., "just now", "2m ago")
 */
export function formatPollingTime(date: Date): string {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 10) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  return `${Math.floor(diffSeconds / 3600)}h ago`;
}

/**
 * Merge optimistic documents with server documents, removing duplicates
 */
export function mergeDocuments(
  documents: DocumentWithProcessingJob[],
  optimisticDocuments: DocumentWithProcessingJob[],
): DocumentWithProcessingJob[] {
  const merged = [...optimisticDocuments];

  // Create sets of both IDs and filenames from optimistic documents
  const optimisticIds = new Set(optimisticDocuments.map((doc) => doc.id));
  const optimisticFilenames = new Set(
    optimisticDocuments.map((doc) => doc.originalFilename),
  );

  // Add server documents, but skip any that match optimistic documents by ID or filename
  documents.forEach((doc) => {
    if (
      !optimisticIds.has(doc.id) &&
      !optimisticFilenames.has(doc.originalFilename)
    ) {
      merged.push(doc);
    }
  });

  // Sort by creation date (newest first)
  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Create optimistic document structure
 */
export function createOptimisticDocument(
  documentData: Omit<DocumentWithProcessingJob, "id"> & { id?: string },
): DocumentWithProcessingJob {
  return {
    ...documentData,
    id: documentData.id || `optimistic-${Date.now()}`,
    status: "processing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    processingJob: {
      id: `optimistic-job-${Date.now()}`,
      status: "pending",
      processingStage: "queued",
      retryCount: 0,
      fileType: documentData.mimeType,
      filePath: `optimistic/${documentData.originalFilename}`,
    },
  };
}
