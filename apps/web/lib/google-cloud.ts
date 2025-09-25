/**
 * Google Cloud Storage integration for RAG document uploads
 *
 * Handles:
 * - Signed URL generation for direct client uploads
 * - Document metadata storage
 * - Integration with RAG processing pipeline
 */

import { Storage } from "@google-cloud/storage";
import { env } from "./env";

// Lazy initialization singleton for Google Cloud Storage
let storage: Storage | null = null;

/**
 * Get Google Cloud Storage client with lazy initialization
 * Only initializes once per session, preventing repeated setup
 */
function getStorageClient(): Storage {
  if (!storage) {
    try {
      console.log("🔧 [google-cloud] Initializing Google Cloud Storage...");
      console.log("🔧 [google-cloud] Environment check:", {
        projectId: env.GOOGLE_CLOUD_PROJECT_ID,
        hasServiceAccountKey: !!env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY,
        bucket: env.GOOGLE_CLOUD_STORAGE_BUCKET,
      });

      if (env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
        // Option 1: Use explicit service account key (development/explicit config)
        console.log(
          "🔑 [google-cloud] Initializing Google Cloud Storage with service account key",
        );

        let credentials;
        try {
          // Assume base64 encoding by default
          console.log(
            "🔐 [google-cloud] Decoding base64 service account key for Google Cloud Storage...",
          );
          const decoded = Buffer.from(
            env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY,
            "base64",
          ).toString("utf8");
          credentials = JSON.parse(decoded);
          console.log(
            "✅ [google-cloud] Successfully parsed service account key for GCS",
          );
          console.log("🔑 [google-cloud] Service account info:", {
            projectId: credentials.project_id,
            clientEmail: credentials.client_email,
            hasPrivateKey: !!credentials.private_key,
          });
        } catch (error) {
          console.error(
            "❌ [google-cloud] Failed to parse base64 service account key for GCS:",
            {
              error: error instanceof Error ? error.message : String(error),
            },
          );
          throw new Error("Invalid base64 service account key format");
        }

        storage = new Storage({
          projectId: env.GOOGLE_CLOUD_PROJECT_ID,
          credentials,
        });
        console.log(
          "✅ [google-cloud] Storage client initialized with service account key",
        );
      } else {
        // Option 2: Use Application Default Credentials (production/gcloud auth)
        console.log(
          "🔐 [google-cloud] Initializing Google Cloud Storage with Application Default Credentials",
        );
        storage = new Storage({
          projectId: env.GOOGLE_CLOUD_PROJECT_ID,
        });
        console.log(
          "✅ [google-cloud] Storage client initialized with Application Default Credentials",
        );
      }
    } catch (error) {
      console.error(
        "💥 [google-cloud] Failed to initialize Google Cloud Storage:",
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      throw new Error(
        "Google Cloud Storage authentication failed. Please check your credentials.",
      );
    }
  }

  return storage;
}

interface UploadUrlRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId: string;
}

interface UploadUrlResponse {
  signedUrl: string;
  bucketName: string;
  fileName: string;
  expiresIn: number;
}

/**
 * Generate a signed URL for direct client upload to Google Cloud Storage
 */
export async function generateSignedUploadUrl({
  fileName,
  fileSize,
  mimeType,
  userId,
}: UploadUrlRequest): Promise<UploadUrlResponse> {
  console.log("🚀 [google-cloud] generateSignedUploadUrl called with:", {
    fileName,
    fileSize,
    mimeType,
    userId,
    // DEBUG: Check for filename duplication at GCS entry point
    nameComponents: fileName.split("."),
    hasPotentialDuplication: (() => {
      const parts = fileName.split(".");
      return (
        parts.length > 2 && parts[parts.length - 1] === parts[parts.length - 2]
      );
    })(),
  });

  const bucketName = env.GOOGLE_CLOUD_STORAGE_BUCKET;
  console.log("🪣 [google-cloud] Using bucket:", bucketName);

  // Create unique file path: userId/filename-timestamp
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  // Split filename and extension for better formatting
  const lastDotIndex = sanitizedFileName.lastIndexOf(".");
  const name =
    lastDotIndex > 0
      ? sanitizedFileName.substring(0, lastDotIndex)
      : sanitizedFileName;
  const extension =
    lastDotIndex > 0 ? sanitizedFileName.substring(lastDotIndex) : "";

  const gcsFileName = `${userId}/${name}-${timestamp}${extension}`;

  console.log("📁 [google-cloud] Generated GCS file path:", {
    original: fileName,
    sanitized: sanitizedFileName,
    name: name,
    extension: extension,
    full: gcsFileName,
    timestamp,
  });

  const storageClient = getStorageClient();
  const bucket = storageClient.bucket(bucketName);
  const file = bucket.file(gcsFileName);

  // Configure upload options
  const options = {
    version: "v4" as const,
    action: "write" as const,
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: mimeType,
    conditions: [
      ["content-length-range", 0, fileSize * 1.1], // Allow 10% size variance
      ["eq", "$Content-Type", mimeType],
    ],
  };

  console.log("⚙️ [google-cloud] Upload options:", {
    version: options.version,
    action: options.action,
    expires: new Date(options.expires).toISOString(),
    contentType: options.contentType,
    conditions: options.conditions,
  });

  try {
    console.log("🔗 [google-cloud] Generating signed URL...");
    const [signedUrl] = await file.getSignedUrl(options);
    console.log("✅ [google-cloud] Signed URL generated successfully");

    const response = {
      signedUrl,
      bucketName,
      fileName: gcsFileName,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };

    console.log("📤 [google-cloud] Returning response:", {
      hasSignedUrl: !!response.signedUrl,
      bucketName: response.bucketName,
      fileName: response.fileName,
      expiresIn: response.expiresIn,
    });

    return response;
  } catch (error) {
    console.error("💥 [google-cloud] Error generating signed URL:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Check if a file exists in Google Cloud Storage
 */
export async function fileExists(
  bucketName: string,
  fileName: string,
): Promise<boolean> {
  console.log("🔍 [google-cloud] fileExists called with:", {
    bucketName,
    fileName,
  });

  try {
    const storageClient = getStorageClient();
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(fileName);

    console.log("☁️ [google-cloud] Checking file existence in GCS...");
    const [exists] = await file.exists();

    console.log("✅ [google-cloud] File existence check result:", {
      exists,
      bucket: bucketName,
      file: fileName,
    });

    return exists;
  } catch (error) {
    console.error("💥 [google-cloud] Error checking file existence:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      bucketName,
      fileName,
    });
    return false;
  }
}

/**
 * Get file metadata from Google Cloud Storage
 */
export async function getFileMetadata(bucketName: string, fileName: string) {
  try {
    const storageClient = getStorageClient();
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(fileName);
    const [metadata] = await file.getMetadata();
    return metadata;
  } catch (error) {
    console.error("Error getting file metadata:", error);
    throw error;
  }
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(
  bucketName: string,
  fileName: string,
): Promise<void> {
  try {
    const storageClient = getStorageClient();
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(fileName);
    await file.delete();
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}
