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
    "application/vnd.ms-powerpoint": [".ppt"],
    "application/msword": [".doc"],
    "text/plain": [".txt"],
  },
  // Images (processed by multimodal embeddings)
  images: {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "image/bmp": [".bmp"],
    "image/tiff": [".tiff", ".tif"],
    "image/x-icon": [".ico"],
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
