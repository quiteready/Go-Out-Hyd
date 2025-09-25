"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/drizzle/db";
import { conversations, messages } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";

export async function renameConversation(
  conversationId: string,
  newTitle: string,
) {
  try {
    const userId = await requireUserId();

    // Validate title
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || trimmedTitle.length > 100) {
      return { error: "Title must be between 1 and 100 characters" };
    }

    // Update conversation with user ownership check
    await db
      .update(conversations)
      .set({
        title: trimmedTitle,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.user_id, userId),
        ),
      );

    revalidatePath("/history");
    return { success: true };
  } catch (error) {
    console.error("Error renaming conversation:", error);
    return { error: "Failed to rename conversation" };
  }
}

export async function deleteConversation(conversationId: string) {
  try {
    const userId = await requireUserId();

    // Delete messages first (foreign key constraint)
    await db
      .delete(messages)
      .where(eq(messages.conversation_id, conversationId));

    // Delete conversation with user ownership check
    await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.user_id, userId),
        ),
      );

    revalidatePath("/history");
    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { error: "Failed to delete conversation" };
  }
}
