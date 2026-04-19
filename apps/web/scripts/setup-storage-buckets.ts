/**
 * Setup Supabase Storage buckets for the admin dashboard.
 *
 * Creates two public-read buckets used by the admin image upload flow:
 *   - cafe-images   (cafe cover photos + cafe gallery)
 *   - event-images  (event cover photos)
 *
 * Both buckets are public-read so <Image src={publicUrl}> works without
 * signed URLs. Writes are gated by the service-role key (admin only).
 *
 * Idempotent: safe to re-run. If a bucket already exists, the existing
 * config is preserved and a notice is printed.
 *
 * Usage (from apps/web):
 *   npm run storage:setup
 *
 * Equivalent to:
 *   npx dotenv-cli -e .env.local -- tsx scripts/setup-storage-buckets.ts
 *
 * Required env vars (loaded from .env.local via dotenv-cli):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

interface BucketSpec {
  id: string;
  description: string;
}

const BUCKETS: BucketSpec[] = [
  { id: "cafe-images", description: "Cafe cover photos and gallery images" },
  { id: "event-images", description: "Event cover photos" },
];

// Per-bucket Supabase Storage options. Both buckets are public-read.
// 5 MiB cap is generous for 1600×900 JPEG/WebP cover images.
const BUCKET_OPTIONS: {
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
} = {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
};

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("SUPABASE_URL is not set");
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  const supabase = createClient(url, serviceRoleKey);

  console.log("🪣  Setting up Supabase Storage buckets…");
  console.log(`   Project: ${url}`);

  const { data: existing, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }
  const existingIds = new Set((existing ?? []).map((b) => b.id));

  for (const bucket of BUCKETS) {
    if (existingIds.has(bucket.id)) {
      console.log(`   ⏭️  ${bucket.id} — already exists, skipping create`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(
      bucket.id,
      BUCKET_OPTIONS,
    );
    if (error) {
      throw new Error(
        `Failed to create bucket "${bucket.id}": ${error.message}`,
      );
    }
    console.log(`   ✅ ${bucket.id} — created (${bucket.description})`);
  }

  console.log("✨ Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Storage setup failed:");
    console.error(err);
    process.exit(1);
  });
