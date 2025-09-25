import { db } from "@/lib/drizzle/db";
import { documents, documentProcessingJobs } from "@/lib/drizzle/schema";
import { eq, and, desc, inArray, gte } from "drizzle-orm";

// Define the processing status type based on the enum
type ProcessingJobStatus =
  | "pending"
  | "processing"
  | "processed"
  | "error"
  | "retry_pending"
  | "cancelled"
  | "partially_processed";

// Enhanced API response type for polling with recent completions
export interface ProcessingStatusResponse {
  activeJobs: DocumentWithProcessingJob[];
  recentlyCompleted: DocumentWithProcessingJob[];
  timestamp: string;
  hasActiveProcessing: boolean;
}

// Job transition tracking for completion detection
export interface JobTransition {
  jobId: string;
  documentId: string;
  filename: string;
  oldStatus: string;
  newStatus: string;
  transitionTime: string;
}

// Enhanced document interface that includes processing job data
export interface DocumentWithProcessingJob {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  status: "uploading" | "processing" | "completed" | "error";
  chunkCount?: number;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  // Enhanced processing job data
  processingJob?: {
    id: string;
    status: ProcessingJobStatus;
    processingStage: string;
    errorMessage?: string;
    processingStartedAt?: string;
    completedAt?: string;
    retryCount: number;
    fileSize?: number;
    fileType: string;
    filePath: string;
  } | null;
}

/**
 * Get all documents for a user with processing job data
 */
export async function getDocumentsWithProcessingStatus(
  userId: string,
  options: {
    offset?: number;
    status?: "uploading" | "processing" | "completed" | "error";
  } = {},
): Promise<{
  documents?: DocumentWithProcessingJob[];
  pagination?: {
    total: number;
    offset: number;
  };
  success: boolean;
  error?: string;
}> {
  try {
    const { offset = 0, status } = options;

    // Build where conditions
    const whereConditions = [eq(documents.user_id, userId)];

    // Add status filter if provided
    if (status) {
      whereConditions.push(eq(documents.status, status));
    }

    // Query documents with LEFT JOIN to processing jobs
    const userDocuments = await db
      .select({
        // Document fields
        id: documents.id,
        originalFilename: documents.original_filename,
        fileSize: documents.file_size,
        mimeType: documents.mime_type,
        status: documents.status,
        chunkCount: documents.chunk_count,
        processingError: documents.processing_error,
        createdAt: documents.created_at,
        updatedAt: documents.updated_at,
        processedAt: documents.processed_at,
        // Processing job fields
        processingJobId: documentProcessingJobs.id,
        processingJobStatus: documentProcessingJobs.status,
        processingStage: documentProcessingJobs.processingStage,
        errorMessage: documentProcessingJobs.errorMessage,
        processingStartedAt: documentProcessingJobs.processingStartedAt,
        completedAt: documentProcessingJobs.completedAt,
        retryCount: documentProcessingJobs.retryCount,
        jobFileSize: documentProcessingJobs.fileSize,
        fileType: documentProcessingJobs.fileType,
        filePath: documentProcessingJobs.filePath,
      })
      .from(documents)
      .leftJoin(
        documentProcessingJobs,
        eq(documents.id, documentProcessingJobs.documentId),
      )
      .where(
        whereConditions.length === 1
          ? whereConditions[0]
          : and(...whereConditions),
      )
      .orderBy(desc(documents.created_at))
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: documents.id })
      .from(documents)
      .where(eq(documents.user_id, userId));

    const totalCount = totalCountResult.length;

    // Transform results to include processing job data
    const transformedDocuments: DocumentWithProcessingJob[] = userDocuments.map(
      (doc) => ({
        id: doc.id,
        originalFilename: doc.originalFilename,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: doc.status,
        chunkCount: doc.chunkCount || undefined,
        processingError: doc.processingError || undefined,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        processedAt: doc.processedAt?.toISOString(),
        processingJob: doc.processingJobId
          ? {
              id: doc.processingJobId,
              status: doc.processingJobStatus!,
              processingStage: doc.processingStage!,
              errorMessage: doc.errorMessage || undefined,
              processingStartedAt: doc.processingStartedAt?.toISOString(),
              completedAt: doc.completedAt?.toISOString(),
              retryCount: doc.retryCount!,
              fileSize: doc.jobFileSize || undefined,
              fileType: doc.fileType!,
              filePath: doc.filePath!,
            }
          : null,
      }),
    );

    return {
      success: true,
      documents: transformedDocuments,
      pagination: {
        total: totalCount,
        offset,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching documents with processing status:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch documents",
    };
  }
}

/**
 * Get both active processing jobs and recently completed jobs
 * Enhanced for polling with completion detection - includes 60 second window
 */
export async function getActiveAndRecentProcessingJobs(
  userId: string,
  recentWindowSeconds: number = 60,
): Promise<{
  success: boolean;
  activeJobs?: DocumentWithProcessingJob[];
  recentlyCompleted?: DocumentWithProcessingJob[];
  error?: string;
}> {
  try {
    // Get active processing jobs (existing logic)
    const activeJobsResult = await getActiveProcessingJobs(userId);
    if (!activeJobsResult.success) {
      return {
        success: false,
        error: activeJobsResult.error,
      };
    }

    // Get recently completed jobs within the specified time window
    const recentlyCompletedStates: ProcessingJobStatus[] = [
      "processed",
      "error",
    ];

    const recentlyCompleted = await db
      .select({
        // Document fields
        id: documents.id,
        originalFilename: documents.original_filename,
        fileSize: documents.file_size,
        mimeType: documents.mime_type,
        status: documents.status,
        chunkCount: documents.chunk_count,
        processingError: documents.processing_error,
        createdAt: documents.created_at,
        updatedAt: documents.updated_at,
        processedAt: documents.processed_at,
        // Processing job fields
        processingJobId: documentProcessingJobs.id,
        processingJobStatus: documentProcessingJobs.status,
        processingStage: documentProcessingJobs.processingStage,
        errorMessage: documentProcessingJobs.errorMessage,
        processingStartedAt: documentProcessingJobs.processingStartedAt,
        completedAt: documentProcessingJobs.completedAt,
        retryCount: documentProcessingJobs.retryCount,
        jobFileSize: documentProcessingJobs.fileSize,
        fileType: documentProcessingJobs.fileType,
        filePath: documentProcessingJobs.filePath,
      })
      .from(documents)
      .innerJoin(
        documentProcessingJobs,
        eq(documents.id, documentProcessingJobs.documentId),
      )
      .where(
        and(
          eq(documents.user_id, userId),
          inArray(documentProcessingJobs.status, recentlyCompletedStates),
          gte(
            documentProcessingJobs.updatedAt,
            new Date(Date.now() - recentWindowSeconds * 1000),
          ),
        ),
      )
      .orderBy(desc(documentProcessingJobs.updatedAt));

    // Transform recently completed results
    const transformedRecentlyCompleted: DocumentWithProcessingJob[] =
      recentlyCompleted.map((doc) => ({
        id: doc.id,
        originalFilename: doc.originalFilename,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: doc.status,
        chunkCount: doc.chunkCount || undefined,
        processingError: doc.processingError || undefined,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        processedAt: doc.processedAt?.toISOString(),
        processingJob: {
          id: doc.processingJobId!,
          status: doc.processingJobStatus!,
          processingStage: doc.processingStage!,
          errorMessage: doc.errorMessage || undefined,
          processingStartedAt: doc.processingStartedAt?.toISOString(),
          completedAt: doc.completedAt?.toISOString(),
          retryCount: doc.retryCount!,
          fileSize: doc.jobFileSize || undefined,
          fileType: doc.fileType!,
          filePath: doc.filePath!,
        },
      }));

    return {
      success: true,
      activeJobs: activeJobsResult.data || [],
      recentlyCompleted: transformedRecentlyCompleted,
    };
  } catch (error) {
    console.error(
      "❌ Error fetching active and recent processing jobs:",
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch processing jobs",
    };
  }
}

/**
 * Get processing status for documents currently being processed
 * Optimized for real-time polling - only returns non-final states
 */
export async function getActiveProcessingJobs(userId: string): Promise<{
  success: boolean;
  data?: DocumentWithProcessingJob[];
  error?: string;
}> {
  try {
    // Only fetch documents that are currently being processed
    const activeProcessingStates: ProcessingJobStatus[] = [
      "pending",
      "processing",
      "retry_pending",
    ];

    const activeDocuments = await db
      .select({
        // Document fields
        id: documents.id,
        originalFilename: documents.original_filename,
        fileSize: documents.file_size,
        mimeType: documents.mime_type,
        status: documents.status,
        chunkCount: documents.chunk_count,
        processingError: documents.processing_error,
        createdAt: documents.created_at,
        updatedAt: documents.updated_at,
        processedAt: documents.processed_at,
        // Processing job fields
        processingJobId: documentProcessingJobs.id,
        processingJobStatus: documentProcessingJobs.status,
        processingStage: documentProcessingJobs.processingStage,
        errorMessage: documentProcessingJobs.errorMessage,
        processingStartedAt: documentProcessingJobs.processingStartedAt,
        completedAt: documentProcessingJobs.completedAt,
        retryCount: documentProcessingJobs.retryCount,
        jobFileSize: documentProcessingJobs.fileSize,
        fileType: documentProcessingJobs.fileType,
        filePath: documentProcessingJobs.filePath,
      })
      .from(documents)
      .innerJoin(
        documentProcessingJobs,
        eq(documents.id, documentProcessingJobs.documentId),
      )
      .where(
        and(
          eq(documents.user_id, userId),
          inArray(documentProcessingJobs.status, activeProcessingStates),
        ),
      )
      .orderBy(desc(documents.created_at));

    // Transform results
    const transformedDocuments = activeDocuments.map((doc) => ({
      id: doc.id,
      originalFilename: doc.originalFilename,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      status: doc.status,
      chunkCount: doc.chunkCount || undefined,
      processingError: doc.processingError || undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      processedAt: doc.processedAt?.toISOString(),
      processingJob: {
        id: doc.processingJobId!,
        status: doc.processingJobStatus!,
        processingStage: doc.processingStage!,
        errorMessage: doc.errorMessage || undefined,
        processingStartedAt: doc.processingStartedAt?.toISOString(),
        completedAt: doc.completedAt?.toISOString(),
        retryCount: doc.retryCount!,
        fileSize: doc.jobFileSize || undefined,
        fileType: doc.fileType!,
        filePath: doc.filePath!,
      },
    }));

    return {
      success: true,
      data: transformedDocuments,
    };
  } catch (error) {
    console.error("❌ Error fetching active processing jobs:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch active processing jobs",
    };
  }
}

/**
 * Get detailed processing information for a specific document
 * Used for error inspection and detailed progress views
 */
export async function getDocumentProcessingDetails(
  documentId: string,
  userId: string,
): Promise<{
  success: boolean;
  data?: DocumentWithProcessingJob | null;
  error?: string;
}> {
  try {
    const result = await db
      .select({
        // Document fields
        id: documents.id,
        originalFilename: documents.original_filename,
        fileSize: documents.file_size,
        mimeType: documents.mime_type,
        status: documents.status,
        chunkCount: documents.chunk_count,
        processingError: documents.processing_error,
        createdAt: documents.created_at,
        updatedAt: documents.updated_at,
        processedAt: documents.processed_at,
        // Processing job fields
        processingJobId: documentProcessingJobs.id,
        processingJobStatus: documentProcessingJobs.status,
        processingStage: documentProcessingJobs.processingStage,
        errorMessage: documentProcessingJobs.errorMessage,
        processingStartedAt: documentProcessingJobs.processingStartedAt,
        completedAt: documentProcessingJobs.completedAt,
        retryCount: documentProcessingJobs.retryCount,
        jobFileSize: documentProcessingJobs.fileSize,
        fileType: documentProcessingJobs.fileType,
        filePath: documentProcessingJobs.filePath,
      })
      .from(documents)
      .leftJoin(
        documentProcessingJobs,
        eq(documents.id, documentProcessingJobs.documentId),
      )
      .where(and(eq(documents.id, documentId), eq(documents.user_id, userId)))
      .limit(1);

    if (result.length === 0) {
      return {
        success: true,
        data: null,
      };
    }

    const doc = result[0];

    const transformedDocument = {
      id: doc.id,
      originalFilename: doc.originalFilename,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      status: doc.status,
      chunkCount: doc.chunkCount || undefined,
      processingError: doc.processingError || undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      processedAt: doc.processedAt?.toISOString(),
      processingJob: doc.processingJobId
        ? {
            id: doc.processingJobId,
            status: doc.processingJobStatus!,
            processingStage: doc.processingStage!,
            errorMessage: doc.errorMessage || undefined,
            processingStartedAt: doc.processingStartedAt?.toISOString(),
            completedAt: doc.completedAt?.toISOString(),
            retryCount: doc.retryCount!,
            fileSize: doc.jobFileSize || undefined,
            fileType: doc.fileType!,
            filePath: doc.filePath!,
          }
        : null,
    };

    return {
      success: true,
      data: transformedDocument,
    };
  } catch (error) {
    console.error("❌ Error fetching document processing details:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch document details",
    };
  }
}
