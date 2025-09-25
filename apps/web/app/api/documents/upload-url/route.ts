import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/drizzle/db";
import { documents, documentProcessingJobs } from "@/lib/drizzle/schema";
import { validateFileMetadata } from "@/lib/file-validation";
import { generateSignedUploadUrl } from "@/lib/google-cloud";
import { checkDocumentUploadLimits } from "@/lib/usage-tracking";
import { randomUUID } from "crypto";

const uploadRequestSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("🚀 [upload-url] POST request received");

    // Parse and validate request body
    const body = await request.json();
    console.log("📤 [upload-url] Request body:", body);

    const { fileName, contentType, fileSize } = uploadRequestSchema.parse(body);
    console.log("✅ [upload-url] Schema validation passed:", {
      fileName,
      contentType,
      fileSize,
    });

    // Authenticate user
    console.log("👤 [upload-url] Authenticating user...");
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("👤 [upload-url] Auth check result:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("❌ [upload-url] Authentication failed");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check usage limits before proceeding with upload
    const usageCheck = await checkDocumentUploadLimits(user.id, fileSize);

    if (!usageCheck.allowed) {
      console.error("❌ [upload-url] Usage limit exceeded:", usageCheck.reason);
      return NextResponse.json({ error: usageCheck.reason }, { status: 403 });
    }

    // Validate file metadata using our validation system
    console.log("🔍 [upload-url] Validating file metadata...");
    const validation = validateFileMetadata(contentType, fileSize);
    console.log("🔍 [upload-url] File validation result:", validation);

    if (!validation.valid) {
      console.error(
        "❌ [upload-url] File validation failed:",
        validation.error,
      );
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const fileCategory = validation.category!;
    console.log("📂 [upload-url] File category:", fileCategory);

    // Generate unique document ID
    const documentId = randomUUID();
    console.log("🆔 [upload-url] Generated document ID:", documentId);

    // Generate signed upload URL using centralized function
    console.log("☁️ [upload-url] Generating signed upload URL...");
    const uploadParams = {
      fileName,
      fileSize,
      mimeType: contentType,
      userId: user.id,
    };
    console.log("☁️ [upload-url] Upload params:", uploadParams);

    const uploadResponse = await generateSignedUploadUrl(uploadParams);
    console.log("✅ [upload-url] Upload response received:", {
      bucketName: uploadResponse.bucketName,
      fileName: uploadResponse.fileName,
      hasSignedUrl: !!uploadResponse.signedUrl,
      expiresIn: uploadResponse.expiresIn,
    });

    // Create database records atomically (document + processing job)
    console.log("💾 [upload-url] Creating database records...");
    await db.transaction(async (tx) => {
      // Create document record
      const documentData = {
        id: documentId,
        user_id: user.id,
        filename: uploadResponse.fileName.split("/").pop() || fileName,
        original_filename: fileName,
        file_size: fileSize,
        mime_type: contentType,
        file_category: fileCategory,
        gcs_bucket: uploadResponse.bucketName,
        gcs_path: `gs://${uploadResponse.bucketName}/${uploadResponse.fileName}`,
        status: "uploading" as const,
      };
      console.log("💾 [upload-url] Document record data:", documentData);

      await tx.insert(documents).values(documentData);

      // Create processing job record
      const processingJobData = {
        documentId,
        fileType: contentType,
        filePath: uploadResponse.fileName,
        fileSize,
        status: "pending" as const,
        processingStage: "pending" as const,
      };
      console.log("💾 [upload-url] Processing job data:", processingJobData);

      await tx.insert(documentProcessingJobs).values(processingJobData);
    });

    console.log("✅ [upload-url] Database records created successfully");

    // Return upload URL and document info
    const response = {
      success: true,
      data: {
        documentId,
        uploadUrl: uploadResponse.signedUrl,
        gcsPath: uploadResponse.fileName,
        fileCategory,
        expiresAt: new Date(
          Date.now() + uploadResponse.expiresIn * 1000,
        ).toISOString(),
      },
    };

    console.log("📤 [upload-url] Sending response:", {
      success: response.success,
      documentId: response.data.documentId,
      hasUploadUrl: !!response.data.uploadUrl,
      gcsPath: response.data.gcsPath,
      fileCategory: response.data.fileCategory,
      expiresAt: response.data.expiresAt,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 [upload-url] Upload URL generation error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      console.error("❌ [upload-url] Zod validation error:", error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
