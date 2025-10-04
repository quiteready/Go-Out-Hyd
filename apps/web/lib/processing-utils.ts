import {
  STAGE_DEFINITIONS,
  WORKFLOWS,
  STAGE_MAPPING,
  TIME_ESTIMATES_BY_TYPE,
  FALLBACK_STAGE_INFO,
  MAX_RETRIES,
  FileTypeWorkflow,
  ParsedStageInfo,
} from "./processing-constants";
import { RotateCcw, Scissors } from "lucide-react";

/**
 * Helper function to format stage names from snake_case to Title Case
 */
export function formatStageName(stage: string): string {
  return stage
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get base stage information for a given stage
 */
export function getBaseStageInfo(stage: string): ParsedStageInfo {
  const stageInfo = STAGE_DEFINITIONS[stage as keyof typeof STAGE_DEFINITIONS];
  if (stageInfo) {
    return { ...stageInfo, progress: 0 };
  }

  return {
    label: formatStageName(stage),
    ...FALLBACK_STAGE_INFO,
  };
}

/**
 * Monotonic progress calculation using media-specific workflows
 */
export function calculateMonotonicProgress(
  stage: string,
  fileType: FileTypeWorkflow
): number {
  // Handle stage mapping first
  const mappedStage =
    STAGE_MAPPING[stage as keyof typeof STAGE_MAPPING] || stage;

  // Handle dynamic batch processing stages (video only)
  const batchMatch = stage.match(/^processing_batch_(\d+)_of_(\d+)$/);
  if (batchMatch && fileType === "video") {
    const [, current, total] = batchMatch;
    const currentBatch = parseInt(current);
    const totalBatches = parseInt(total);

    // Interpolate between creating_video_chunks (20%) and storing (90%)
    // Batch processing spans 20% to 90% of total progress
    const batchProgress = (currentBatch - 1) / totalBatches; // 0 to 1 (batch 1 = 0%, batch N = 100%)
    const stageStart = 20;
    const stageEnd = 90;
    const interpolatedProgress =
      stageStart + (stageEnd - stageStart) * batchProgress;

    return Math.round(interpolatedProgress); // Always round to avoid fractions
  }

  // Get workflow for file type
  const workflow = WORKFLOWS[fileType];
  if (!workflow) {
    return 50; // Fallback
  }

  // Find progress from appropriate workflow
  const stageInfo = workflow.find((s) => s.stage === mappedStage);
  if (stageInfo) {
    return stageInfo.progress;
  }

  // Fallback progress value
  return 50;
}

/**
 * Intelligent stage parsing with dynamic chunk handling
 */
export function parseProcessingStage(
  stage: string,
  retryCount: number,
  isRetry: boolean,
  fileType: FileTypeWorkflow = "video"
): ParsedStageInfo {
  // Handle retry states first
  if (isRetry && retryCount > 0) {
    const baseStageInfo = getBaseStageInfo(stage);
    return {
      ...baseStageInfo,
      isRetry: true,
      retryAttempt: retryCount,
      label: `Retry ${retryCount} - ${baseStageInfo.label}`,
      icon: RotateCcw,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    };
  }

  // Handle dynamic batch processing stages
  const batchMatch = stage.match(/^processing_batch_(\d+)_of_(\d+)$/);
  if (batchMatch) {
    const [, current, total] = batchMatch;
    const currentBatch = parseInt(current);
    const totalBatches = parseInt(total);

    // Use same range as calculateMonotonicProgress: 20% to 90%
    const batchProgress = (currentBatch - 1) / totalBatches; // 0 to 1
    const stageStart = 20;
    const stageEnd = 90;
    const totalProgress = Math.round(
      stageStart + (stageEnd - stageStart) * batchProgress
    );

    return {
      label: `Processing Batch ${current} Of ${total}`,
      icon: Scissors,
      color: "text-orange-500",
      bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
      progress: totalProgress,
      description: `Processing video batch ${current} of ${total}`,
      isDynamic: true,
      chunkInfo: { current: currentBatch, total: totalBatches },
    };
  }

  // Handle known stages - always use monotonic progress
  const stageInfo = STAGE_DEFINITIONS[stage as keyof typeof STAGE_DEFINITIONS];
  if (stageInfo) {
    // Always use monotonic progress calculation for consistency
    const progress = calculateMonotonicProgress(stage, fileType);

    return {
      ...stageInfo,
      progress,
    };
  }

  // Fallback for unknown stages
  return {
    label: formatStageName(stage),
    ...FALLBACK_STAGE_INFO,
  };
}

/**
 * Estimate processing time based on file size, stage, and media type
 */
export function estimateTimeRemaining(
  currentStage: string,
  fileSize: number,
  fileType: FileTypeWorkflow = "document",
  startTime?: string
): string | null {
  if (!startTime) return null;

  const start = new Date(startTime);
  const now = new Date();
  const elapsedMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
  const fileSizeMB = fileSize / (1024 * 1024);

  // Handle video batch processing stages specially
  const batchMatch = currentStage.match(/^processing_batch_(\d+)_of_(\d+)$/);
  if (batchMatch && fileType === "video") {
    const [, current, total] = batchMatch;
    const currentBatch = parseInt(current);
    const totalBatches = parseInt(total);

    // Estimate based on real video processing data: ~0.025 min/MB total
    // Batch processing is ~80% of total time
    const totalEstimatedMinutes = fileSizeMB * 0.025;
    const batchProcessingTime = totalEstimatedMinutes * 0.8;

    // Calculate progress through batches and estimate remaining batch time
    const batchProgress = (currentBatch - 1) / totalBatches;
    const remainingBatchTime = batchProcessingTime * (1 - batchProgress);

    // Add small buffer for final storing stage
    const remaining = Math.max(0, remainingBatchTime + fileSizeMB * 0.002);

    if (remaining < 1) return "a few minutes";
    if (remaining < 60) return `~${Math.round(remaining)} minutes`;

    const hours = Math.floor(remaining / 60);
    const minutes = Math.round(remaining % 60);
    return `~${hours}h ${minutes}m`;
  }

  // Handle regular stages with lookup table
  const typeEstimates = TIME_ESTIMATES_BY_TYPE[fileType];
  const stageEstimate =
    typeEstimates[currentStage as keyof typeof typeEstimates] ||
    // Fallback estimates based on file type
    (fileType === "video"
      ? 0.01
      : fileType === "audio"
        ? 0.1
        : fileType === "document"
          ? 0.05
          : 0.1);

  const estimatedTotal = fileSizeMB * stageEstimate;
  const remaining = Math.max(0, estimatedTotal - elapsedMinutes);

  if (remaining < 1) return "a few minutes";
  if (remaining < 60) return `~${Math.round(remaining)} minutes`;

  const hours = Math.floor(remaining / 60);
  const minutes = Math.round(remaining % 60);
  return `~${hours}h ${minutes}m`;
}

/**
 * Check if retry count is exhausted
 */
export function isRetryExhausted(retryCount: number): boolean {
  return retryCount >= MAX_RETRIES;
}
