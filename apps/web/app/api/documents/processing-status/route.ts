import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveProcessingJobs,
  getActiveAndRecentProcessingJobs,
  ProcessingStatusResponse,
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

    // Check if enhanced polling with recent completions is requested
    const { searchParams } = new URL(request.url);
    const includeRecent = searchParams.get("includeRecent") === "true";

    if (includeRecent) {
      // Enhanced polling: get both active and recently completed jobs
      const result = await getActiveAndRecentProcessingJobs(user.id, 60);

      if (!result.success) {
        console.error(
          "❌ Failed to fetch active and recent processing jobs:",
          result.error,
        );
        return NextResponse.json(
          { error: result.error || "Failed to fetch processing status" },
          { status: 500 },
        );
      }

      const response: ProcessingStatusResponse = {
        activeJobs: result.activeJobs || [],
        recentlyCompleted: result.recentlyCompleted || [],
        timestamp: new Date().toISOString(),
        hasActiveProcessing: (result.activeJobs || []).length > 0,
      };

      return NextResponse.json(response);
    } else {
      // Legacy polling: only active documents (backwards compatibility)
      const activeResult = await getActiveProcessingJobs(user.id);

      if (!activeResult.success) {
        console.error(
          "❌ Failed to fetch active processing jobs:",
          activeResult.error,
        );
        return NextResponse.json(
          { error: activeResult.error || "Failed to fetch processing status" },
          { status: 500 },
        );
      }

      const activeDocuments = activeResult.data || [];

      return NextResponse.json({
        documents: activeDocuments,
        timestamp: new Date().toISOString(),
        hasActiveProcessing: activeDocuments.length > 0,
      });
    }
  } catch (error) {
    console.error("Error fetching processing status:", error);
    return NextResponse.json(
      { error: "Failed to fetch processing status" },
      { status: 500 },
    );
  }
}
