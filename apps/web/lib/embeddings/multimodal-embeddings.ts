/**
 * Multimodal Embedding Generation
 *
 * Generates multimodal embeddings using Google's multimodal-embedding-001 model via Vertex AI.
 * This enables searching through videos and images that users upload.
 *
 * Note: Uses Vertex AI (not Google AI API) because multimodal embeddings are only available through Vertex AI.
 */

import { PredictionServiceClient } from "@google-cloud/aiplatform";
import { env } from "@/lib/env";

export class EmbeddingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingServiceError";
  }
}

export interface MultimodalEmbeddingOptions {
  dimension?: number;
  contextualText?: string;
}

export const MULTIMODAL_EMBEDDING_DIMENSIONS = 1408;

// Google Cloud AI Platform response types
interface GoogleCloudValue {
  numberValue?: number;
  stringValue?: string;
}

interface GoogleCloudListValue {
  values?: GoogleCloudValue[];
}

interface GoogleCloudFields {
  textEmbedding?: {
    listValue?: GoogleCloudListValue;
  };
  imageEmbedding?: {
    listValue?: GoogleCloudListValue;
  };
  videoEmbeddings?: {
    listValue?: GoogleCloudListValue;
  };
}

interface GoogleCloudStructValue {
  fields?: GoogleCloudFields;
}

interface GoogleCloudPrediction {
  structValue?: GoogleCloudStructValue;
}

// Google Cloud AI Platform request types
interface GoogleCloudRequestValue {
  stringValue?: string;
  structValue?: {
    fields: {
      [key: string]: GoogleCloudRequestValue;
    };
  };
}

interface GoogleCloudRequestInstance {
  structValue: {
    fields: {
      [key: string]: GoogleCloudRequestValue;
    };
  };
}

interface GoogleCloudRequest {
  endpoint: string;
  instances: GoogleCloudRequestInstance[];
}

export class MultimodalEmbeddingService {
  private client: PredictionServiceClient;
  private projectId: string;
  private location: string;

  /**
   * Extract embedding from API response, handling different field types
   * based on content type (text, image, video)
   */
  private extractEmbeddingFromResponse(
    prediction: GoogleCloudPrediction,
  ): number[] {
    const fields = prediction.structValue?.fields;
    if (!fields) {
      throw new EmbeddingServiceError("No fields found in prediction response");
    }

    // Check for different embedding field types in priority order
    let embeddingField: GoogleCloudListValue | undefined;
    let fieldType: string = "unknown";

    if (fields.textEmbedding?.listValue) {
      embeddingField = fields.textEmbedding.listValue;
      fieldType = "textEmbedding";
    } else if (fields.imageEmbedding?.listValue) {
      embeddingField = fields.imageEmbedding.listValue;
      fieldType = "imageEmbedding";
    } else if (fields.videoEmbeddings?.listValue) {
      embeddingField = fields.videoEmbeddings.listValue;
      fieldType = "videoEmbeddings";
    }

    if (!embeddingField) {
      const availableFields = Object.keys(fields);
      throw new EmbeddingServiceError(
        `No embedding field found in response. Available fields: ${availableFields.join(", ")}`,
      );
    }

    const embedding = embeddingField.values?.map(
      (value: GoogleCloudValue) => value.numberValue || 0,
    );

    if (!embedding || embedding.length === 0) {
      throw new EmbeddingServiceError("Empty embedding returned");
    }

    console.log(`✅ Extracted embedding from ${fieldType} field:`, {
      dimensions: embedding.length,
      fieldType,
    });

    return embedding;
  }

  constructor() {
    if (!env.GOOGLE_CLOUD_PROJECT_ID) {
      throw new EmbeddingServiceError(
        "GOOGLE_CLOUD_PROJECT_ID environment variable is required for Vertex AI multimodal embeddings",
      );
    }

    if (!env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
      throw new EmbeddingServiceError(
        "GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY environment variable is required for Vertex AI multimodal embeddings",
      );
    }

    this.projectId = env.GOOGLE_CLOUD_PROJECT_ID;
    this.location = env.GOOGLE_CLOUD_REGION || "us-central1";

    // Parse the service account key JSON (it's base64-encoded)
    let serviceAccountKey;
    try {
      const decodedKey = Buffer.from(
        env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY,
        "base64",
      ).toString("utf8");
      serviceAccountKey = JSON.parse(decodedKey);
    } catch (error) {
      throw new EmbeddingServiceError(
        `Invalid GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY format. Must be valid base64-encoded JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Initialize Google Cloud AI Platform client with service account credentials
    this.client = new PredictionServiceClient({
      projectId: this.projectId,
      credentials: serviceAccountKey,
    });

    console.log("Initializing multimodal embedding service with Vertex AI");
  }

  /**
   * Generate multimodal embedding for text input
   * Used for query embeddings that will search against multimodal content
   */
  async generateMultimodalEmbedding(
    text: string,
    options: MultimodalEmbeddingOptions = {},
  ): Promise<number[]> {
    const { contextualText = "" } = options;
    // Note: dimension parameter is not supported by multimodal-embedding-001, it always returns 1408 dimensions

    if (!text.trim()) {
      throw new EmbeddingServiceError(
        "Cannot generate embedding for empty text",
      );
    }

    try {
      console.log("Generating multimodal embedding:", {
        textLength: text.length,
        contextualTextLength: contextualText.length,
      });

      const finalText = contextualText ? `${contextualText}\n\n${text}` : text;

      // Construct the request for multimodal embedding
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/multimodalembedding@001`;

      const request = {
        endpoint,
        instances: [
          {
            structValue: {
              fields: {
                text: {
                  stringValue: finalText,
                },
              },
            },
          },
        ],
      };

      console.log("Making prediction request to:", endpoint);

      const [predictResponse] = await this.client.predict(request, {
        timeout: 90000,
      });

      if (
        !predictResponse.predictions ||
        predictResponse.predictions.length === 0
      ) {
        throw new EmbeddingServiceError("No predictions returned from API");
      }

      const prediction = predictResponse.predictions[0];
      if (
        !prediction ||
        typeof prediction !== "object" ||
        !("structValue" in prediction)
      ) {
        throw new EmbeddingServiceError("Invalid prediction format");
      }

      // Extract embeddings from the response using the correct field
      const typedPrediction = prediction as GoogleCloudPrediction;
      const embedding = this.extractEmbeddingFromResponse(typedPrediction);

      console.log("Generated multimodal embedding successfully:", {
        dimensions: embedding.length,
        textLength: text.length,
      });

      return embedding;
    } catch (error) {
      // Enhanced error logging with context
      const isTimeoutError =
        error instanceof Error &&
        (error.message.includes("DEADLINE_EXCEEDED") ||
          error.message.includes("timeout"));

      console.error("Multimodal embedding generation failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
        isTimeout: isTimeoutError,
        textLength: text.length,
        contextualTextLength: contextualText.length,
        endpoint: `multimodalembedding@001`,
      });

      if (error instanceof EmbeddingServiceError) {
        throw error;
      }

      // Include timeout information in error message for better debugging
      const errorPrefix = isTimeoutError ? "Timeout error" : "API error";
      throw new EmbeddingServiceError(
        `${errorPrefix} - Failed to generate multimodal embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate embeddings for media files with text context
   * For processing uploaded media files (images, videos)
   */
  async generateMediaEmbedding(mediaContent: {
    text?: string;
    image?: { data: string; mimeType: string } | { url: string };
    video?: { url: string };
  }): Promise<number[]> {
    try {
      console.log("Generating media embedding:", {
        hasText: !!mediaContent.text,
        hasImage: !!mediaContent.image,
        hasVideo: !!mediaContent.video,
      });

      // Construct the request for multimodal embedding with media content
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/multimodalembedding@001`;

      interface InstanceFields {
        text?: {
          stringValue: string;
        };
        image?: {
          structValue: {
            fields: {
              bytesBase64Encoded?: {
                stringValue: string;
              };
              gcsUri?: {
                stringValue: string;
              };
            };
          };
        };
        video?: {
          structValue: {
            fields: {
              gcsUri: {
                stringValue: string;
              };
            };
          };
        };
      }

      const instanceFields: InstanceFields = {};

      // Add text if provided
      if (mediaContent.text) {
        instanceFields.text = {
          stringValue: mediaContent.text,
        };
      }

      // Add image if provided
      if (mediaContent.image) {
        if ("data" in mediaContent.image) {
          instanceFields.image = {
            structValue: {
              fields: {
                bytesBase64Encoded: {
                  stringValue: mediaContent.image.data,
                },
              },
            },
          };
        } else {
          instanceFields.image = {
            structValue: {
              fields: {
                gcsUri: {
                  stringValue: mediaContent.image.url,
                },
              },
            },
          };
        }
      }

      // Add video if provided
      if (mediaContent.video) {
        instanceFields.video = {
          structValue: {
            fields: {
              gcsUri: {
                stringValue: mediaContent.video.url,
              },
            },
          },
        };
      }

      const request: GoogleCloudRequest = {
        endpoint,
        instances: [
          {
            structValue: {
              fields: instanceFields as {
                [key: string]: GoogleCloudRequestValue;
              },
            },
          },
        ],
      };

      console.log("Making multimodal prediction request to:", endpoint);

      const [predictResponse] = await this.client.predict(request, {
        timeout: 90000,
      });

      if (
        !predictResponse.predictions ||
        predictResponse.predictions.length === 0
      ) {
        throw new EmbeddingServiceError("No predictions returned from API");
      }

      const prediction = predictResponse.predictions[0];
      if (
        !prediction ||
        typeof prediction !== "object" ||
        !("structValue" in prediction)
      ) {
        throw new EmbeddingServiceError("Invalid prediction format");
      }

      // Extract embeddings from the response using the correct field
      const typedPrediction = prediction as GoogleCloudPrediction;
      const embedding = this.extractEmbeddingFromResponse(typedPrediction);

      console.log("Generated media embedding successfully:", {
        dimensions: embedding.length,
        hasText: !!mediaContent.text,
        hasImage: !!mediaContent.image,
        hasVideo: !!mediaContent.video,
      });

      return embedding;
    } catch (error) {
      // Enhanced error logging with context
      const isTimeoutError =
        error instanceof Error &&
        (error.message.includes("DEADLINE_EXCEEDED") ||
          error.message.includes("timeout"));

      console.error("Media embedding generation failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
        isTimeout: isTimeoutError,
        hasText: !!mediaContent.text,
        hasImage: !!mediaContent.image,
        hasVideo: !!mediaContent.video,
        endpoint: `multimodalembedding@001`,
      });

      if (error instanceof EmbeddingServiceError) {
        throw error;
      }

      // Include timeout information in error message for better debugging
      const errorPrefix = isTimeoutError ? "Timeout error" : "API error";
      throw new EmbeddingServiceError(
        `${errorPrefix} - Failed to generate media embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate embeddings for image content with optional text context
   */
  async generateImageEmbedding(
    imageData: { data: string; mimeType: string } | { url: string },
    textContext?: string,
  ): Promise<number[]> {
    return await this.generateMediaEmbedding({
      image: imageData,
      text: textContext,
    });
  }

  /**
   * Generate embeddings for video content with optional text context
   */
  async generateVideoEmbedding(
    videoUrl: string,
    textContext?: string,
  ): Promise<number[]> {
    return await this.generateMediaEmbedding({
      video: { url: videoUrl },
      text: textContext,
    });
  }
}

// Global service instance
let multimodalEmbeddingService: MultimodalEmbeddingService | null = null;

export function getMultimodalEmbeddingService(): MultimodalEmbeddingService {
  if (!multimodalEmbeddingService) {
    multimodalEmbeddingService = new MultimodalEmbeddingService();
  }
  return multimodalEmbeddingService;
}
