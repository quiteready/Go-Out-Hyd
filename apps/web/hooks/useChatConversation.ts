import { useRef, RefObject } from "react";
import { type Conversation } from "@/lib/drizzle/schema";

export function useChatConversation(initialConversation: Conversation | null): {
  currentConversationId: RefObject<string | null>;
  handleNewConversation: (conversationId: string) => void;
  navigateToConversation: () => void;
} {
  const currentConversationId = useRef(initialConversation?.id || null);
  const isNewConversationRef = useRef(!initialConversation);

  const handleNewConversation = (conversationId: string): void => {
    currentConversationId.current = conversationId;
    isNewConversationRef.current = true;
  };

  const navigateToConversation = (): void => {
    if (isNewConversationRef.current && currentConversationId.current) {
      const newUrl = `/chat/${currentConversationId.current}`;
      window.history.replaceState(
        { ...window.history.state, url: newUrl, as: newUrl },
        "",
        newUrl,
      );
      isNewConversationRef.current = false;
    }
  };

  return {
    currentConversationId,
    handleNewConversation,
    navigateToConversation,
  };
}
