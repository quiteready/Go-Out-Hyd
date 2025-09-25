import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Drizzle
    DATABASE_URL: z.string().url(),

    // Supabase (server-only - no browser exposure)
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // Google AI (for text embeddings and chat)
    GEMINI_API_KEY: z.string().min(1),

    // Google Cloud Vertex AI (for multimodal embeddings only)
    GOOGLE_CLOUD_PROJECT_ID: z.string().min(1),
    GOOGLE_CLOUD_REGION: z.string().default("us-central1"),
    // Service account key for Vertex AI multimodal embeddings
    GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY: z.string().min(1),

    // Google Cloud Storage Bucket (for file uploads)
    GOOGLE_CLOUD_STORAGE_BUCKET: z.string().min(1),

  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    // Server variables
    DATABASE_URL: process.env.DATABASE_URL,

    // Supabase (server-only)
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Google AI
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    // Google Cloud Vertex AI (for multimodal embeddings)
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
    GOOGLE_CLOUD_REGION: process.env.GOOGLE_CLOUD_REGION,
    GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY:
      process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY,

    // Google Cloud Storage Bucket (for file uploads)
    GOOGLE_CLOUD_STORAGE_BUCKET: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,

    // Client variables
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
