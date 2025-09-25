"use server";

import { db } from "@/lib/drizzle/db";
import { documents } from "@/lib/drizzle/schema";
import { sql } from "drizzle-orm";
import { requireAdminAccess } from "@/lib/auth";

type ServerActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Gets RAG statistics for admin dashboard.
 * ADMIN ONLY - Should only be callable by admin users.
 */
export async function getRAGStatsForAdmin(): Promise<
  ServerActionResponse<{
    totalDocuments: number;
    totalStorageUsed: number;
  }>
> {
  try {
    // Verify user has admin role (handles authentication internally)
    await requireAdminAccess();

    // Get document statistics
    const documentStats = await db
      .select({
        total: sql<number>`count(*)`.as("total"),
        totalStorage: sql<number>`sum(${documents.file_size})`.as(
          "totalStorage",
        ),
      })
      .from(documents);


    const docStat = documentStats[0];

    const stats = {
      totalDocuments: Number(docStat?.total) || 0,
      totalStorageUsed: Number(docStat?.totalStorage) || 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching RAG stats for admin:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch RAG statistics",
    };
  }
}
