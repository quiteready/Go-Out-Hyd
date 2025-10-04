import {
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZES,
} from "@/lib/file-validation-constants";

export type FileCategory = keyof typeof SUPPORTED_FILE_TYPES;
export type SupportedMimeType =
  keyof (typeof SUPPORTED_FILE_TYPES)[FileCategory];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  category?: FileCategory;
  maxSize?: number;
}

export function getFileCategory(mimeType: string): FileCategory | null {
  for (const [category, types] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (types[mimeType as keyof typeof types]) {
      return category as FileCategory;
    }
  }
  return null;
}

export function validateFileMetadata(
  mimeType: string,
  fileSize: number
): FileValidationResult {
  // Check if file type is supported
  const category = getFileCategory(mimeType);

  if (!category) {
    return {
      valid: false,
      error: `Unsupported file type: ${mimeType}. Please upload a supported document, image, video, or audio file.`,
    };
  }

  // Check file size
  const maxSize = MAX_FILE_SIZES[category];
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${category}: ${formatFileSize(maxSize)}. Your file: ${formatFileSize(fileSize)}.`,
      category,
      maxSize,
    };
  }

  // Check for empty files
  if (fileSize === 0) {
    return {
      valid: false,
      error: "File is empty. Please select a valid file.",
      category,
      maxSize,
    };
  }

  return {
    valid: true,
    category,
    maxSize,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getAcceptedFileTypes(): string {
  const allTypes = Object.values(SUPPORTED_FILE_TYPES).reduce((acc, types) => {
    return { ...acc, ...types };
  }, {});

  return Object.values(allTypes).flat().join(",");
}

export function getSupportedExtensions(): string[] {
  const extensions: string[] = [];

  Object.values(SUPPORTED_FILE_TYPES).forEach((category) => {
    Object.values(category).forEach((exts) => {
      extensions.push(...exts);
    });
  });

  return extensions;
}

export function getFileTypeDescription(category: FileCategory): string {
  const descriptions = {
    documents: "Documents (PDF, DOCX, DOC, PPTX, PPT, TXT, MD)",
    images: "Images (PNG, JPEG, WebP, GIF, BMP, TIFF)",
    videos: "Videos (MP4, AVI, MOV, WebM, WMV, 3GP)",
    audio: "Audio (MP3, WAV, FLAC, AAC, OGG, M4A, 3GP)",
  };

  return descriptions[category];
}

export function getAllSupportedTypesDescription(): string {
  return Object.keys(SUPPORTED_FILE_TYPES)
    .map((category) => getFileTypeDescription(category as FileCategory))
    .join(", ");
}
