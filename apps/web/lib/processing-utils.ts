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
  fileType: FileTypeWorkflow,
): number {
  // Handle stage mapping first
  const mappedStage =
    STAGE_MAPPING[stage as keyof typeof STAGE_MAPPING] || stage;

  // Handle dynamic chunk processing stages (video only)
  const chunkMatch = stage.match(/^processing_chunk_(\d+)_of_(\d+)$/);
  if (chunkMatch && fileType === "video") {
    const [, current, total] = chunkMatch;
    const currentChunk = parseInt(current);
    const totalChunks = parseInt(total);

    // Interpolate between processing_video (20%) and storing (95%)
    const chunkProgress = currentChunk / totalChunks; // 0 to 1
    const stageStart = 20;
    const stageEnd = 95;
    const interpolatedProgress =
      stageStart + (stageEnd - stageStart) * chunkProgress;

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
  fileType: FileTypeWorkflow = "video",
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

  // Handle dynamic chunk processing stages
  const chunkMatch = stage.match(/^processing_chunk_(\d+)_of_(\d+)$/);
  if (chunkMatch) {
    const [, current, total] = chunkMatch;
    const currentChunk = parseInt(current);
    const totalChunks = parseInt(total);

    // Use same range as calculateMonotonicProgress: 20% to 95%
    const chunkProgress = currentChunk / totalChunks;
    const stageStart = 20;
    const stageEnd = 95;
    const totalProgress = Math.round(
      stageStart + (stageEnd - stageStart) * chunkProgress,
    );

    return {
      label: `Processing Chunk ${current}/${total}`,
      icon: Scissors,
      color: "text-orange-500",
      bgColor: "bg-orange-100/50 dark:bg-orange-900/20",
      progress: totalProgress,
      description: `Processing video chunk ${current} of ${total}`,
      isDynamic: true,
      chunkInfo: { current: currentChunk, total: totalChunks },
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
  startTime?: string,
): string | null {
  if (!startTime) return null;

  const start = new Date(startTime);
  const now = new Date();
  const elapsedMinutes = (now.getTime() - start.getTime()) / (1000 * 60);

  // Get media-specific estimates
  const typeEstimates = TIME_ESTIMATES_BY_TYPE[fileType];
  const fileSizeMB = fileSize / (1024 * 1024);
  const stageEstimate =
    typeEstimates[currentStage as keyof typeof typeEstimates] || 0.5;
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
