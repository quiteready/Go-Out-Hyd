import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDocumentsWithProcessingStatus,
  getActiveProcessingJobs,
} from "@/lib/documents";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const activeOnly = searchParams.get("activeOnly") === "true";

    // If requesting only active processing jobs (for polling)
    if (activeOnly) {
      const activeResult = await getActiveProcessingJobs(user.id);

      if (!activeResult.success) {
        console.error(
          "❌ Failed to fetch active processing jobs:",
          activeResult.error,
        );
        return NextResponse.json(
          {
            error:
              activeResult.error || "Failed to fetch active processing jobs",
          },
          { status: 500 },
        );
      }

      const activeDocuments = activeResult.data || [];
      return NextResponse.json({
        documents: activeDocuments,
        pagination: {
          total: activeDocuments.length,
          offset: 0,
        },
      });
    }

    // Get documents with processing status
    const result = await getDocumentsWithProcessingStatus(user.id, {
      offset,
      status: status as
        | "uploading"
        | "processing"
        | "completed"
        | "error"
        | undefined,
    });

    if (!result.success) {
      console.error(
        "❌ Failed to fetch documents with processing status:",
        result.error,
      );
      return NextResponse.json(
        { error: result.error || "Failed to fetch documents" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      documents: result.documents || [],
      pagination: result.pagination || {
        total: 0,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}
