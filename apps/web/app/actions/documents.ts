"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/drizzle/db";
import { documents } from "@/lib/drizzle/schema/documents";
import { eq, and } from "drizzle-orm";

// Types for server action results
export type CheckFilenameResult =
  | { exists: false }
  | {
      exists: true;
      conflictingDocument: {
        id: string;
        filename: string;
        originalFilename: string;
        createdAt: Date;
        fileSize: number;
      };
    };

export type CheckFilenameError = {
  error: string;
};

/**
 * Check if a filename already exists in the user's documents
 * @param filename The original filename to check for duplicates
 * @returns Conflict information if a duplicate exists, or confirmation if no conflict
 */
export async function checkFilenameExists(
  filename: string,
): Promise<CheckFilenameResult | CheckFilenameError> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/auth/login");
    }

    // Validate filename input
    const trimmedFilename = filename.trim();
    if (!trimmedFilename) {
      return { error: "Filename cannot be empty" };
    }

    if (trimmedFilename.length > 255) {
      return { error: "Filename is too long (maximum 255 characters)" };
    }

    // Query for existing document with same original_filename
    const existingDocuments = await db
      .select({
        id: documents.id,
        filename: documents.filename,
        originalFilename: documents.original_filename,
        createdAt: documents.created_at,
        fileSize: documents.file_size,
      })
      .from(documents)
      .where(
        and(
          eq(documents.user_id, user.id),
          eq(documents.original_filename, trimmedFilename),
        ),
      )
      .limit(1);

    // Check if conflict exists
    if (existingDocuments.length > 0) {
      const conflictingDoc = existingDocuments[0];
      return {
        exists: true,
        conflictingDocument: {
          id: conflictingDoc.id,
          filename: conflictingDoc.filename,
          originalFilename: conflictingDoc.originalFilename,
          createdAt: conflictingDoc.createdAt,
          fileSize: conflictingDoc.fileSize,
        },
      };
    }

    // No conflict found
    return { exists: false };
  } catch (error) {
    console.error("Error checking filename:", error);

    // Follow project pattern of throwing errors rather than fallback behavior
    if (error instanceof Error) {
      return { error: `Failed to check filename: ${error.message}` };
    }

    return { error: "Failed to check filename due to an unexpected error" };
  }
}
