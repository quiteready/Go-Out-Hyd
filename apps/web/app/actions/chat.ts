"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/drizzle/db";
import { getCurrentUserId } from "@/lib/auth";
import {
  conversations,
  messages as dbMessages,
  NewConversation,
  type MessageAttachment,
} from "@/lib/drizzle/schema";

import { IMAGE_UPLOAD_CONSTRAINTS, MODEL_CONFIG } from "@/lib/app-utils";
import { generateImagePath } from "@/lib/attachments";
import { eq, desc, and } from "drizzle-orm";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "@/lib/env";

// Create Google AI provider instance for title generation
const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

/**
 * Vector Search Results for RAG Integration
 */
export interface VectorSearchResult {
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
  document_id: string;
}

/**
 * Server-side file upload using server Supabase client
 * @param file - File to upload
 * @param userId - User ID for path generation
 * @returns Upload result with storage path and signed URL
 */
async function uploadFileToStorage(
  file: File,
  userId: string,
): Promise<{
  success: boolean;
  storagePath?: string;
  signedUrl?: string;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    // Validate file on server side
    if (!IMAGE_UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Only ${IMAGE_UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.join(", ")} are allowed.`,
      };
    }

    if (file.size > IMAGE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE) {
      const maxSizeMB = IMAGE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024);
      return {
        success: false,
        error: `File size must be less than ${maxSizeMB}MB`,
      };
    }

    const supabase = await createClient();

    // Generate storage path for the file
    const storagePath = generateImagePath(userId, file.name);

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(IMAGE_UPLOAD_CONSTRAINTS.BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: IMAGE_UPLOAD_CONSTRAINTS.CACHE_CONTROL,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // Create signed URL (24 hours expiration)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(IMAGE_UPLOAD_CONSTRAINTS.BUCKET_NAME)
      .createSignedUrl(storagePath, IMAGE_UPLOAD_CONSTRAINTS.EXPIRATION_TIME);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error("Error creating signed URL:", urlError);
      return {
        success: false,
        error: `Failed to generate signed URL: ${urlError?.message || "Unknown error"}`,
      };
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + IMAGE_UPLOAD_CONSTRAINTS.EXPIRATION_TIME,
    );

    return {
      success: true,
      storagePath,
      signedUrl: signedUrlData.signedUrl,
      expiresAt,
    };
  } catch (error) {
    console.error("Server-side upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

/**
 * Create and save assistant response to database with success or error status
 * @param conversationId - The conversation ID
 * @param content - The assistant's response content
 * @param status - Message status: "success" for normal messages, "error" for failed messages
 * @returns Promise resolving to the created message ID
 */
export async function saveAssistantResponse(
  conversationId: string,
  content: string,
  status: "success" | "error" = "success",
): Promise<string> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("User must be logged in.");
    }

    // Save assistant message with status tracking for error recovery
    const [newMessage] = await db
      .insert(dbMessages)
      .values({
        conversation_id: conversationId,
        sender: "assistant",
        content: content,
        attachments: [],
        status: status,
      })
      .returning({ id: dbMessages.id });

    // Note: No revalidation here to prevent flickering during streaming
    return newMessage.id;
  } catch (error) {
    console.error("Failed to save assistant response:", error);
    throw error;
  }
}

/**
 * Save or update assistant message based on trigger type.
 * Consolidates the logic for handling regenerate vs submit triggers.
 * @param trigger - Whether this is a regenerate or submit message
 * @param conversationId - The conversation ID
 * @param content - The assistant response content
 * @param status - Message status: "success" for normal messages, "error" for failed messages
 */
export async function handleAssistantMessage({
  trigger,
  conversationId,
  content,
  status = "success",
}: {
  trigger: "submit-message" | "regenerate-message";
  conversationId: string;
  content: string;
  status?: "success" | "error";
}): Promise<void> {
  if (trigger === "regenerate-message") {
    // Update existing assistant message
    await updateLastAssistantMessage({
      conversationId,
      content,
      status,
    });
  } else {
    // Create new assistant message for submit-message trigger
    await saveAssistantResponse(conversationId, content, status);
  }
}

/**
 * Update the last assistant message (regardless of status) with new content and status.
 * Used for regenerate functionality on both successful and error messages.
 * @param conversationId - The conversation ID
 * @param content - The new assistant response content
 * @param status - Message status: "success" for normal messages, "error" for failed messages
 * @returns Promise that resolves to true if an assistant message was updated, false if none was found
 */
export async function updateLastAssistantMessage({
  conversationId,
  content,
  status = "success",
}: {
  conversationId: string;
  content: string;
  status?: "success" | "error";
}): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error("User must be logged in.");
    }

    // Find the last assistant message in the conversation regardless of status
    const lastAssistantMessage = await db
      .select({ id: dbMessages.id })
      .from(dbMessages)
      .where(
        and(
          eq(dbMessages.conversation_id, conversationId),
          eq(dbMessages.sender, "assistant"),
        ),
      )
      .orderBy(desc(dbMessages.created_at))
      .limit(1);

    if (lastAssistantMessage.length === 0) {
      return false; // No assistant message to update
    }

    // Update the assistant message content and status
    await db
      .update(dbMessages)
      .set({
        content: content,
        status: status,
      })
      .where(eq(dbMessages.id, lastAssistantMessage[0].id));

    return true;
  } catch (error) {
    console.error("Failed to update last assistant message:", error);
    throw error;
  }
}

/**
 * Updates the title of a conversation.
 * Helper function for AI title generation.
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<{ success: boolean }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("User must be logged in.");
  }

  try {
    // Update conversation title with user ownership check
    await db
      .update(conversations)
      .set({
        title: title.substring(0, 100), // Ensure title doesn't exceed 100 chars
        updated_at: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return { success: true };
  } catch (error) {
    console.error("Error updating conversation title:", error);
    throw error;
  }
}

/**
 * Generates an AI-powered title for a conversation based on the user's first message.
 * This function runs asynchronously in the background and updates the conversation title.
 * If generation fails, the conversation title remains unchanged (null).
 */
export async function generateConversationTitle(
  conversationId: string,
  userMessageContent: string,
): Promise<void> {
  try {
    // Validate inputs
    if (!conversationId || !userMessageContent?.trim()) {
      console.warn("Invalid inputs for title generation:", {
        conversationId,
        userMessageContent,
      });
      return;
    }

    // Prepare the message for AI processing (truncate if too long to avoid context issues)
    const messageForAI =
      userMessageContent.length > 1000
        ? userMessageContent.substring(0, 1000) + "..."
        : userMessageContent;

    const systemPrompt = `You are a specialized conversation title generator for a multi-model AI chat platform. Your task is to create concise, descriptive titles that help users quickly identify and navigate their conversation history across different AI models.

**Guidelines:**
- Generate titles that are 3-8 words maximum
- Focus on the main topic, question, or task being discussed
- Use clear, searchable keywords that users would remember
- Avoid generic phrases like "question about" or "help with"
- For technical topics, be specific (e.g., "Python Error Debugging" not "Coding Help")
- For creative tasks, capture the creative focus (e.g., "Marketing Campaign Ideas" not "Creative Writing")
- For analysis requests, include the subject matter (e.g., "Climate Data Analysis")
- For multi-step conversations, focus on the primary objective

**Return only the title text - no quotes, explanations, or additional formatting.**`;

    // Generate title using Google AI
    const result = await generateText({
      model: google(MODEL_CONFIG.name),
      system: systemPrompt,
      prompt: `Generate a conversation title for this user message: ${messageForAI}`,
      temperature: 0.3, // Lower temperature for more consistent, focused titles
    });

    let title = result.text?.trim();

    if (!title || title.length === 0) {
      // Fallback to a title from the user message if AI generation fails
      title =
        userMessageContent.length > 50
          ? userMessageContent.substring(0, 50) + "..."
          : userMessageContent.substring(0, 50);
    }

    await updateConversationTitle(conversationId, title);
  } catch (error) {
    console.error(
      `Title generation failed for conversation ${conversationId}:`,
      error,
    );

    // Fallback to simple title on error
    try {
      const fallbackTitle =
        userMessageContent.length > 50
          ? userMessageContent.substring(0, 50) + "..."
          : userMessageContent;
      await updateConversationTitle(conversationId, fallbackTitle);
    } catch (fallbackError) {
      console.error(
        `Both AI generation and fallback failed for conversation ${conversationId}:`,
        fallbackError,
      );
    }
  }
}

/**
 * Saves a user's message with attachments. Creates a new conversation if one doesn't exist.
 * @param conversationId - Optional existing conversation ID
 * @param userMessageContent - The user's message content
 * @param files - Array of files to upload and attach
 * @returns The conversation ID and attachment data for AI streaming
 */
export async function saveMessage(
  conversationId: string | null,
  userMessageContent: string,
  files: File[] = [],
): Promise<{
  success: boolean;
  conversationId?: string;
  messageId?: string;
  attachments?: MessageAttachment[];
  isNewConversation?: boolean;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "User must be logged in.",
      };
    }

    let finalConversationId = conversationId;
    let isNewConversation = false;

    // Step 1: Create conversation if needed
    if (!finalConversationId) {
      isNewConversation = true;

      const title =
        userMessageContent.length > 50
          ? userMessageContent.substring(0, 50) + "..."
          : userMessageContent;

      const newConversation: NewConversation = {
        user_id: userId,
        title: title,
      };

      const [conversation] = await db
        .insert(conversations)
        .values(newConversation)
        .returning();

      finalConversationId = conversation.id;

      // Generate AI title in background (fire-and-forget)
      generateConversationTitle(finalConversationId, userMessageContent).catch(
        (error) => {
          console.error("Background title generation failed:", error);
        },
      );
    } else {
      // Update existing conversation timestamp
      await db
        .update(conversations)
        .set({
          updated_at: new Date(),
        })
        .where(eq(conversations.id, finalConversationId));
    }

    // Step 2: Upload files and create attachments (if any files provided)
    const attachments: MessageAttachment[] = [];

    if (files.length > 0) {
      for (const file of files) {
        const uploadResult = await uploadFileToStorage(file, userId);

        if (
          !uploadResult.success ||
          !uploadResult.storagePath ||
          !uploadResult.signedUrl ||
          !uploadResult.expiresAt
        ) {
          console.error(`Upload failed for ${file.name}:`, uploadResult.error);
          return {
            success: false,
            error: `Failed to upload file: ${file.name}. ${uploadResult.error || "Unknown error"}`,
          };
        }

        const attachment: MessageAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          contentType: file.type,
          fileSize: file.size,
          storagePath: uploadResult.storagePath,
          signedUrl: uploadResult.signedUrl,
          expiresAt: uploadResult.expiresAt.toISOString(),
        };

        attachments.push(attachment);
      }
    }

    // Step 3: Save the user's message with attachments
    const [newMessage] = await db
      .insert(dbMessages)
      .values({
        conversation_id: finalConversationId,
        sender: "user",
        content: userMessageContent,
        attachments: attachments,
      })
      .returning({ id: dbMessages.id });

    return {
      success: true,
      conversationId: finalConversationId,
      messageId: newMessage.id,
      attachments: attachments,
      isNewConversation,
    };
  } catch (error) {
    console.error("❌ Failed to create conversation with message:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create conversation and message",
    };
  }
}
