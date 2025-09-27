import {
  Clock,
  Download,
  FileText,
  Scissors,
  Mic,
  Sparkles,
  Save,
  CheckCircle,
  RotateCcw,
  XCircle,
  Video,
  Headphones,
  Image,
  HelpCircle,
} from "lucide-react";

// ✅ Processing Configuration Constants
export const MAX_RETRIES = 3;

// ✅ File Type Workflow Types
export type FileTypeWorkflow = "document" | "video" | "audio" | "image";

// ✅ Processing Status Types
export type ProcessingStatus =
  | "pending"
  | "processing"
  | "processed"
  | "error"
  | "retry_pending"
  | "cancelled"
  | "partially_processed";

// ✅ Parsed Stage Info Interface
export interface ParsedStageInfo {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  progress?: number;
  isRetry?: boolean;
  retryAttempt?: number;
  isDynamic?: boolean;
  chunkInfo?: { current: number; total: number };
  isUnknown?: boolean;
}

// ✅ Simplified Stage Configuration - Using only orange for processing and primary for completed
export const STAGE_DEFINITIONS = {
  // === COMMON STAGES ===
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Spinning up servers to start processing",
  },
  downloading: {
    label: "Downloading",
    icon: Download,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Downloading file from storage",
  },
  storing: {
    label: "Saving Results",
    icon: Save,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Saving processed data to database",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-primary",
    bgColor: "bg-primary/10",
    description: "Processing completed successfully",
  },

  // === UPDATED BACKEND STAGES ===
  processing_document: {
    label: "Processing Document",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Extracting text and generating embeddings",
  },
  processing_video: {
    label: "Setting Up Video Processing",
    icon: Video,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Preparing video for chunk processing",
  },
  processing_image: {
    label: "Processing Image",
    icon: Image,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Analyzing image content",
  },
  processing_audio: {
    label: "Processing Audio",
    icon: Headphones,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Setting up audio processing pipeline",
  },
  analyzing_image: {
    label: "Analyzing Image",
    icon: Image,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "AI-powered image analysis",
  },

  // === LEGACY STAGES (for backward compatibility) ===
  extracting_text: {
    label: "Processing Document",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Extracting text content from document",
  },
  analyzing_audio: {
    label: "Analyzing Audio",
    icon: Headphones,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Analyzing audio properties",
  },
  transcribing_audio: {
    label: "Transcribing",
    icon: Mic,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Converting speech to text",
  },
  analyzing_video: {
    label: "Analyzing Video",
    icon: Video,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Analyzing video properties and duration",
  },
  creating_video_chunks: {
    label: "Creating Chunks",
    icon: Scissors,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Splitting video into processable segments",
  },
  generating_embeddings: {
    label: "Creating Embeddings",
    icon: Sparkles,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Generating content embeddings",
  },

  // === ERROR/RETRY STAGES ===
  retrying: {
    label: "Retrying",
    icon: RotateCcw,
    color: "text-orange-500",
    bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
    description: "Retrying after previous failure",
  },
  retry_exhausted: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-100/50 dark:bg-red-900/20",
    description: "Processing failed after maximum retries",
  },
} as const;

// ✅ Media-Specific Workflows with Progress Values - Updated to match backend reality
export const WORKFLOWS = {
  document: [
    { stage: "pending", progress: 0 },
    { stage: "downloading", progress: 20 },
    { stage: "processing_document", progress: 70 },
    { stage: "storing", progress: 95 },
    { stage: "completed", progress: 100 },
  ],

  audio: [
    { stage: "pending", progress: 0 },
    { stage: "downloading", progress: 20 },
    { stage: "processing_audio", progress: 35 },
    { stage: "analyzing_audio", progress: 55 },
    { stage: "transcribing_audio", progress: 80 },
    { stage: "storing", progress: 95 },
    { stage: "completed", progress: 100 },
  ],

  video: [
    { stage: "pending", progress: 0 },
    { stage: "downloading", progress: 10 },
    { stage: "processing_video", progress: 20 },
    // Dynamic chunk processing: processing_chunk_X_of_Y (20-90%)
    { stage: "storing", progress: 95 },
    { stage: "completed", progress: 100 },
  ],

  image: [
    { stage: "pending", progress: 0 },
    { stage: "downloading", progress: 20 },
    { stage: "processing_image", progress: 50 },
    { stage: "analyzing_image", progress: 80 },
    { stage: "storing", progress: 95 },
    { stage: "completed", progress: 100 },
  ],
} as const;

// ✅ Stage name mapping to handle backend variations and legacy stages
export const STAGE_MAPPING = {
  // Map legacy stages to new processing stages
  extracting_text: "processing_document",
  extracting_audio: "processing_audio",
  extracting_frames: "processing_video",

  // Handle old embedding stages - map to storing since embeddings are done during processing
  generating_embeddings: "storing",
} as const;

// ✅ Media-specific time estimates - Updated based on real processing data
export const TIME_ESTIMATES_BY_TYPE = {
  document: {
    downloading: 0.05,
    processing_document: 0.3, // Combined text extraction + embedding
    storing: 0.05,
  },
  audio: {
    downloading: 0.1,
    processing_audio: 0.05, // Brief setup
    analyzing_audio: 0.125, // Audio analysis
    transcribing_audio: 0.25, // Main transcription work
    storing: 0.05,
  },
  video: {
    downloading: 0.005, // Much faster than expected: ~2 seconds per 100MB
    processing_video: 0.01, // Setup phase: ~4 seconds per 100MB
    storing: 0.002, // Very fast save: ~1 second per 100MB
    // Note: Most video processing time is in dynamic chunk processing (0.02-0.03 min/MB total)
    // Based on real data: 382MB video processed in ~9.5 minutes
  },
  image: {
    downloading: 0.05,
    processing_image: 0.125,
    analyzing_image: 0.125,
    storing: 0.05,
  },
} as const;

// ✅ Fallback Stage Info
export const FALLBACK_STAGE_INFO = {
  icon: HelpCircle,
  color: "text-orange-500",
  bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
  description: "Processing in progress",
  progress: 50,
  isUnknown: true,
} as const;
