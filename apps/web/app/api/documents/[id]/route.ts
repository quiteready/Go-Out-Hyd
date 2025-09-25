import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/drizzle/db";
import { documents, documentChunks } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { deleteFile } from "@/lib/google-cloud";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = (await params).id;

    // Find the document and verify ownership
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.user_id, user.id)))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Start transaction to delete everything
    await db.transaction(async (tx) => {
      // Delete all associated chunks first (foreign key constraint)
      await tx
        .delete(documentChunks)
        .where(eq(documentChunks.document_id, documentId));

      // Delete the document record
      await tx.delete(documents).where(eq(documents.id, documentId));

      // Delete file from Google Cloud Storage
      // Extract file path from full GCS URL (remove gs://bucket-name/ prefix)
      const gcsUrlPrefix = `gs://${document.gcs_bucket}/`;
      const filePath = document.gcs_path.startsWith(gcsUrlPrefix)
        ? document.gcs_path.substring(gcsUrlPrefix.length)
        : document.gcs_path;

      console.log("☁️ [delete] Extracted file path for deletion:", {
        original: document.gcs_path,
        extracted: filePath,
        bucket: document.gcs_bucket,
      });

      // Note: We don't await this to avoid blocking the response
      // If GCS deletion fails, the file will be orphaned but data consistency is maintained
      deleteFile(document.gcs_bucket, filePath).catch((error) => {
        console.error("Failed to delete file from GCS:", error);
        // Could log to monitoring service here
      });
    });

    return NextResponse.json({
      success: true,
      message: "Document and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
