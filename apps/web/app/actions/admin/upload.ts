"use server";

import { randomUUID } from "node:crypto";
import { createSupabaseServerAdminClient } from "@/lib/supabase/admin";
import { assertLocalhost } from "@/lib/admin/auth";

export type UploadBucket = "cafe-images" | "event-images";

export type UploadImageResult =
  | { success: true; url: string; path: string }
  | { success: false; error: string };

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MiB — must stay <= bucket fileSizeLimit
const ALLOWED_BUCKETS = new Set<UploadBucket>(["cafe-images", "event-images"]);

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

/**
 * Uploads an image to a public Supabase Storage bucket and returns the
 * public URL. Filename is randomized so concurrent uploads of the same
 * source filename never collide.
 *
 * Caller is responsible for storing the returned URL on the relevant
 * row (cafe.cover_image, event.cover_image, cafe_image.image_url, etc.).
 */
export async function uploadImage(
  formData: FormData,
  bucket: UploadBucket,
): Promise<UploadImageResult> {
  await assertLocalhost();

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return { success: false, error: "Invalid bucket" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }

  if (file.size === 0) {
    return { success: false, error: "File is empty" };
  }
  if (file.size > MAX_BYTES) {
    return {
      success: false,
      error: `File too large (max ${Math.round(MAX_BYTES / (1024 * 1024))} MB)`,
    };
  }

  const mime = file.type;
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return {
      success: false,
      error: "Unsupported file type. Use JPEG, PNG, WebP, or AVIF.",
    };
  }

  const supabase = createSupabaseServerAdminClient();
  const ext = extensionForMime(mime);
  const objectPath = `${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, {
      contentType: mime,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return { success: true, url: data.publicUrl, path: objectPath };
}
