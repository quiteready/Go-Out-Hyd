import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/drizzle/db";
import { documents } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { fileExists } from "@/lib/google-cloud";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    console.log("🚀 [complete] POST request received for document:", id);

    // Get authenticated user
    console.log("👤 [complete] Authenticating user...");
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("👤 [complete] Auth check result:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("❌ [complete] Authentication failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = id;
    console.log("🆔 [complete] Document ID:", documentId);

    // Find the document and verify ownership
    console.log("🔍 [complete] Finding document in database...");
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.user_id, user.id)))
      .limit(1);

    console.log("🔍 [complete] Document query result:", {
      found: !!document,
      status: document?.status,
      filename: document?.filename,
      gcs_bucket: document?.gcs_bucket,
      gcs_path: document?.gcs_path,
    });

    if (!document) {
      console.error("❌ [complete] Document not found or access denied");
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (document.status !== "uploading") {
      console.log("ℹ️ [complete] Document not in uploading state:", {
        currentStatus: document.status,
        expectedStatus: "uploading",
      });

      // Handle race condition: If EventArc already started processing, that's fine
      if (document.status === "processing") {
        console.log(
          "✅ [complete] EventArc already started processing - this is expected",
        );
        return NextResponse.json({
          success: true,
          documentId,
          status: "processing",
          message:
            "Upload completed successfully, automatic processing already started",
        });
      }

      // Handle case where processing already completed
      if (document.status === "completed") {
        console.log(
          "✅ [complete] Document already completed - this is expected",
        );
        return NextResponse.json({
          success: true,
          documentId,
          status: "completed",
          message: "Upload and processing completed successfully",
        });
      }

      // Only error for unexpected statuses like "error"
      console.error("❌ [complete] Document in unexpected state:", {
        currentStatus: document.status,
        expectedStatus: "uploading, processing, or completed",
      });
      return NextResponse.json(
        {
          error: `Document is in unexpected state: ${document.status}. Please try uploading again.`,
        },
        { status: 400 },
      );
    }

    // Verify file exists in GCS
    console.log("☁️ [complete] Verifying file exists in GCS...");
    console.log("☁️ [complete] GCS check params:", {
      bucket: document.gcs_bucket,
      path: document.gcs_path,
    });

    // Extract file path from full GCS URL (remove gs://bucket-name/ prefix)
    const gcsUrlPrefix = `gs://${document.gcs_bucket}/`;
    const filePath = document.gcs_path.startsWith(gcsUrlPrefix)
      ? document.gcs_path.substring(gcsUrlPrefix.length)
      : document.gcs_path;

    console.log("☁️ [complete] Extracted file path:", {
      original: document.gcs_path,
      extracted: filePath,
    });

    const exists = await fileExists(document.gcs_bucket, filePath);
    console.log("☁️ [complete] GCS file exists check result:", exists);

    if (!exists) {
      console.error("❌ [complete] File not found in GCS storage");

      // Update document status to error
      console.log("💾 [complete] Updating document status to error...");
      await db
        .update(documents)
        .set({
          status: "error",
          processing_error: "File not found in storage",
          updated_at: new Date(),
        })
        .where(eq(documents.id, documentId));

      console.log("✅ [complete] Document status updated to error");
      return NextResponse.json(
        { error: "File not found in storage" },
        { status: 400 },
      );
    }

    // Upload verified - EventArc will automatically detect the GCS event
    // and transition the document to processing status
    console.log(
      "✅ [complete] Upload verification complete, EventArc will handle processing",
    );

    const response = {
      success: true,
      documentId,
      status: "uploading", // Status remains uploading until EventArc processes it
      message:
        "Upload completed successfully, automatic processing will begin shortly",
    };

    console.log("🎉 [complete] Successfully completed upload process");
    console.log("📤 [complete] Sending response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 [complete] Error completing upload:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to complete upload" },
      { status: 500 },
    );
  }
}
