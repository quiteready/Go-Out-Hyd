// Client-safe file validation constants

export const SUPPORTED_FILE_TYPES = {
  // Documents (processed by docling)
  documents: {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [".pptx"],
    "text/plain": [".txt"],
    "text/markdown": [".md", ".markdown"],
  },
  // Images (processed by multimodal embeddings)
  images: {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
    "image/pjpeg": [".jpg", ".jpeg"],
    "image/x-png": [".png"],
  },
  // Videos (processed by multimodal embeddings)
  videos: {
    "video/mp4": [".mp4"],
    "video/avi": [".avi"],
    "video/quicktime": [".mov"],
    "video/x-msvideo": [".avi"],
    "video/webm": [".webm"],
    "video/x-ms-wmv": [".wmv"],
    "video/x-flv": [".flv"],
    "video/x-matroska": [".mkv"],
    "video/mpeg": [".mpeg", ".mpg"],
    "video/3gpp": [".3gp"],
    "video/3gpp2": [".3g2"],
  },
  // Audio (processed by transcription → text embeddings)
  audio: {
    "audio/mpeg": [".mp3"],
    "audio/wav": [".wav"],
    "audio/flac": [".flac"],
    "audio/aac": [".aac"],
    "audio/ogg": [".ogg"],
    "audio/x-wav": [".wav"],
    "audio/vorbis": [".ogg"],
    "audio/mp4": [".m4a"],
    "audio/x-m4a": [".m4a"],
    "audio/mp3": [".mp3"],
    "audio/wave": [".wav"],
    "audio/x-aac": [".aac"],
    "audio/x-flac": [".flac"],
    "audio/3gpp": [".3gp"],
    "audio/3gpp2": [".3g2"],
  },
} as const;

export const MAX_FILE_SIZES = {
  documents: 100 * 1024 * 1024, // 100MB for documents
  images: 15 * 1024 * 1024, // 15MB for images (Google multimodal limit)
  videos: 1024 * 1024 * 1024, // 1GB for videos (system limit)
  audio: 1024 * 1024 * 1024, // 1GB for audio files (system limit)
} as const;

// Reverse mapping: file extension -> MIME type
// This is used as a fallback when browsers (especially Windows) don't provide MIME types
export const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  // Documents
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  // Images
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  // Videos
  ".mp4": "video/mp4",
  ".avi": "video/avi",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".wmv": "video/x-ms-wmv",
  ".flv": "video/x-flv",
  ".mkv": "video/x-matroska",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".3gp": "video/3gpp",
  ".3g2": "video/3gpp2",
  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
} as const;
