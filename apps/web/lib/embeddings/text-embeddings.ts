import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";
import { env } from "@/lib/env";

export class EmbeddingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingServiceError";
  }
}

export class TextEmbeddingService {
  private google: ReturnType<typeof createGoogleGenerativeAI>;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new EmbeddingServiceError(
        "GEMINI_API_KEY environment variable is required. Get it from https://aistudio.google.com/app/apikey",
      );
    }

    this.google = createGoogleGenerativeAI({
      apiKey: env.GEMINI_API_KEY,
    });
    console.log("Initializing text embedding service with API key");
  }

  async generateTextEmbedding(
    text: string,
    taskType:
      | "RETRIEVAL_QUERY"
      | "RETRIEVAL_DOCUMENT"
      | "SEMANTIC_SIMILARITY" = "RETRIEVAL_QUERY",
    outputDimensionality: number = 768,
  ): Promise<number[]> {
    try {
      console.log("Generating text embedding:", {
        textLength: text.length,
        taskType,
        outputDimensionality,
      });

      const { embedding } = await embed({
        model: this.google.textEmbeddingModel("text-embedding-004"),
        value: text,
        providerOptions: {
          google: {
            outputDimensionality: outputDimensionality,
            taskType: taskType,
          },
        },
      });

      if (!embedding || embedding.length === 0) {
        throw new EmbeddingServiceError("No embeddings returned from API");
      }

      return embedding;
    } catch (error) {
      console.error("Text embedding generation failed:", error);

      if (error instanceof EmbeddingServiceError) {
        throw error;
      }

      throw new EmbeddingServiceError(
        `Failed to generate text embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Global service instance
let textEmbeddingService: TextEmbeddingService | null = null;

export function getTextEmbeddingService(): TextEmbeddingService {
  if (!textEmbeddingService) {
    textEmbeddingService = new TextEmbeddingService();
  }
  return textEmbeddingService;
}

// Debug helpers for easy access to saved embeddings
export function getDebugEmbedding(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("debug-last-embedding");
  }
  return null;
}

export function copyDebugEmbeddingToClipboard(): void {
  if (typeof window !== "undefined" && navigator.clipboard) {
    const data = localStorage.getItem("debug-last-embedding");
    if (data) {
      navigator.clipboard
        .writeText(data)
        .then(() => {
          console.log("✅ Debug embedding copied to clipboard!");
        })
        .catch(() => {
          console.log(
            "❌ Failed to copy to clipboard. Use getDebugEmbedding() instead.",
          );
        });
    } else {
      console.log("❌ No debug embedding found");
    }
  }
}
