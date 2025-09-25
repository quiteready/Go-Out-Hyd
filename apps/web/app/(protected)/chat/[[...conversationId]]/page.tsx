import { db } from "@/lib/drizzle/db";
import { conversations, type Conversation } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ConversationNotFoundError } from "@/components/error/ConversationNotFoundError";
import {
  fetchAndFormatConversationMessages,
  type ExtendedMessage,
} from "@/lib/chat-utils";
import { requireUserId } from "@/lib/auth";
import { ChatStateProvider } from "@/contexts/ChatStateContext";
import { ChatContainer } from "@/components/chat/ChatContainer";

interface ChatPageProps {
  params: Promise<{
    conversationId?: string[];
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const userId = await requireUserId();

  const resolvedParams = await params;
  const conversationId = resolvedParams.conversationId?.[0];

  let conversation: Conversation | null = null;
  let messages: ExtendedMessage[] = [];

  if (conversationId) {
    console.log("🔍 Loading conversation:", conversationId);

    // Get conversation and verify ownership - handle database errors separately
    let conversationResult;
    try {
      conversationResult = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.user_id, userId),
          ),
        )
        .limit(1);
    } catch (error) {
      console.error("Database error fetching conversation:", error);
      return <ConversationNotFoundError />;
    }

    conversation = conversationResult[0] ?? null;

    // If conversation not found, 404 (outside try-catch to avoid error capture)
    if (!conversation) {
      return <ConversationNotFoundError />;
    }

    // Now safely fetch messages since we know conversation exists
    try {
      const messagesResult = await fetchAndFormatConversationMessages(
        conversationId,
        userId,
      );

      if (messagesResult.success && messagesResult.messages) {
        messages = messagesResult.messages;
      } else {
        console.error(
          "❌ Failed to fetch conversation messages:",
          messagesResult.error,
        );
        messages = [];
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      messages = [];
    }
  }

  return (
    <ChatStateProvider conversation={conversation} initialMessages={messages}>
      <div className="h-full w-full flex flex-col">
        <ChatContainer />
      </div>
    </ChatStateProvider>
  );
}
