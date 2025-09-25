import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/drizzle/db";
import {
  messages as dbMessages,
  type MessageAttachment,
} from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { IMAGE_UPLOAD_CONSTRAINTS } from "@/lib/app-utils";
import { getCurrentUserId } from "@/lib/auth";

// Import client-safe utilities for use in server functions
import { isSignedUrlExpired } from "./attachments-client";

// Re-export client-safe utilities from attachments-client.ts
export {
  getFileExtension,
  generateImagePath,
  isSignedUrlExpired,
  formatFileSize,
  isAllowedImageType,
  isValidFileSize,
  validateImageFile,
} from "./attachments-client";

// =============================================================================
// SERVER-SIDE ATTACHMENT OPERATIONS
// =============================================================================

/**
 * Refresh expired attachment URLs using already-fetched messages
 * @param messages - Already fetched messages from database
 * @param userId - User ID for authorization
 * @returns Success status, refresh details, and updated messages
 */
export async function refreshConversationAttachments(
  messages: { id: string; attachments: unknown }[],
  userId: string,
): Promise<{
  success: boolean;
  message: string;
  refreshedCount: number;
  failedCount: number;
  updatedMessages: { id: string; attachments: unknown }[];
  error?: string;
}> {
  try {
    const currentUserId = await getCurrentUserId();

    if (!currentUserId || currentUserId !== userId) {
      throw new Error("User must be logged in.");
    }

    const supabase = await createClient();

    console.log("🔍 Checking for expired attachments in messages");

    let refreshed: number = 0;
    const failed: string[] = [];
    const updatedMessages = [...messages];

    // Calculate new expiration time (same for all attachments)
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(
      newExpiresAt.getSeconds() + IMAGE_UPLOAD_CONSTRAINTS.EXPIRATION_TIME,
    );
    const newExpiresAtISO = newExpiresAt.toISOString();

    let totalExpiredCount = 0;

    // Process each message
    for (let msgIndex = 0; msgIndex < updatedMessages.length; msgIndex++) {
      const message = updatedMessages[msgIndex];
      const attachments = message.attachments as MessageAttachment[];

      if (!attachments || attachments.length === 0) {
        continue;
      }

      // Collect expired attachments and their storage paths for this message
      const expiredAttachments: MessageAttachment[] = [];
      const storagePaths = [];

      for (const attachment of attachments) {
        if (isSignedUrlExpired(attachment.expiresAt)) {
          expiredAttachments.push(attachment);
          storagePaths.push(attachment.storagePath);
        }
      }

      if (expiredAttachments.length === 0) {
        continue; // All attachments in this message are valid, continue to next message
      }

      totalExpiredCount += expiredAttachments.length;
      console.log(
        `🔄 Bulk refreshing ${expiredAttachments.length} URLs for message ${message.id}`,
      );

      try {
        // Bulk refresh expired URLs for this message
        const { data: signedUrls, error: bulkError } = await supabase.storage
          .from(IMAGE_UPLOAD_CONSTRAINTS.BUCKET_NAME)
          .createSignedUrls(
            storagePaths,
            IMAGE_UPLOAD_CONSTRAINTS.EXPIRATION_TIME,
          );

        if (bulkError || !signedUrls) {
          console.error(
            `❌ Failed to bulk refresh URLs for message ${message.id}:`,
            bulkError,
          );
          expiredAttachments.forEach((attachment) =>
            failed.push(attachment.id),
          );
          continue;
        }

        // Update attachments with new URLs
        const updatedAttachments = [...attachments];
        let messageUpdated = false;

        // Map bulk results back to expired attachments
        signedUrls.forEach((urlResult, resultIndex) => {
          const expiredAttachment = expiredAttachments[resultIndex];

          if (urlResult.error || !urlResult.signedUrl) {
            console.error(
              `❌ Failed to refresh URL for ${expiredAttachment.name}:`,
              urlResult.error,
            );
            failed.push(expiredAttachment.id);
            return;
          }

          // Find and update the attachment in the full attachments array
          const attachmentIndex = updatedAttachments.findIndex(
            (att) => att.id === expiredAttachment.id,
          );
          if (attachmentIndex !== -1) {
            updatedAttachments[attachmentIndex] = {
              ...expiredAttachment,
              signedUrl: urlResult.signedUrl,
              expiresAt: newExpiresAtISO,
            };

            refreshed++; // Increment refreshed count
            messageUpdated = true;

            console.log(`✅ Refreshed URL for: ${expiredAttachment.name}`);
          }
        });

        // Update message in database and local array if any attachments were refreshed
        if (messageUpdated) {
          await db
            .update(dbMessages)
            .set({
              attachments: updatedAttachments,
            })
            .where(eq(dbMessages.id, message.id));

          // Update the local message object
          updatedMessages[msgIndex] = {
            ...message,
            attachments: updatedAttachments,
          };

          console.log(
            `✅ Updated message ${message.id} with ${expiredAttachments.length} refreshed URLs`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error bulk refreshing URLs for message ${message.id}:`,
          error,
        );
        expiredAttachments.forEach((attachment) => failed.push(attachment.id));
      }
    }

    if (totalExpiredCount === 0) {
      return {
        success: true,
        message: "No expired attachments found",
        refreshedCount: 0,
        failedCount: 0,
        updatedMessages: messages,
      };
    }

    return {
      success: failed.length === 0,
      message:
        failed.length === 0
          ? `Successfully refreshed ${refreshed} attachment URLs`
          : `Failed to refresh ${failed.length} attachment URLs`,
      refreshedCount: refreshed,
      failedCount: failed.length,
      updatedMessages,
    };
  } catch (error) {
    console.error("❌ Conversation attachment refresh failed:", error);

    return {
      success: false,
      message: "Internal Server Error",
      refreshedCount: 0,
      failedCount: 0,
      updatedMessages: messages,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
