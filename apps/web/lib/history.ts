import { db } from "@/lib/drizzle/db";
import { conversations } from "@/lib/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";

export type ConversationWithModel = {
  id: string;
  title: string | null;
  created_at: Date;
  updated_at: Date;
  message_count?: number;
};

export type GroupedConversations = {
  today: ConversationWithModel[];
  yesterday: ConversationWithModel[];
  thisWeek: ConversationWithModel[];
  older: ConversationWithModel[];
};

export async function getConversationsGrouped(): Promise<{
  success: boolean;
  conversations?: GroupedConversations;
  error?: string;
}> {
  try {
    const userId = await requireUserId();

    // Get all conversations
    const conversationsData = await db
      .select()
      .from(conversations)
      .where(eq(conversations.user_id, userId))
      .orderBy(desc(conversations.updated_at));

    // Transform data for RAG-simple (single model, no model selection)
    const transformedConversations: ConversationWithModel[] =
      conversationsData.map((conv) => ({
        id: conv.id,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        message_count: 0, // Will implement later
      }));

    // Group by time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const grouped: GroupedConversations = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    transformedConversations.forEach((conv) => {
      const updatedDate = new Date(conv.updated_at);

      if (updatedDate >= today) {
        grouped.today.push(conv);
      } else if (updatedDate >= yesterday) {
        grouped.yesterday.push(conv);
      } else if (updatedDate >= thisWeekStart) {
        grouped.thisWeek.push(conv);
      } else {
        grouped.older.push(conv);
      }
    });

    return {
      success: true,
      conversations: grouped,
    };
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch conversations",
    };
  }
}
