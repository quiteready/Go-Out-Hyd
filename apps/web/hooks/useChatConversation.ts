import { useRef, useState, RefObject } from "react";
import { type Conversation } from "@/lib/drizzle/schema";

export function useChatConversation(initialConversation: Conversation | null): {
  localConversation: Conversation | null;
  currentConversationId: RefObject<string | null>;
  isNewConversationRef: RefObject<boolean>;
  updateConversation: (conversation: Conversation) => void;
  handleNewConversation: (conversationId: string) => void;
  navigateToConversation: () => void;
} {
  const [localConversation, setLocalConversation] =
    useState<Conversation | null>(initialConversation);
  const currentConversationId = useRef(initialConversation?.id || null);
  const isNewConversationRef = useRef(!initialConversation);

  const updateConversation = (conversation: Conversation): void => {
    setLocalConversation(conversation);
    currentConversationId.current = conversation.id;
    isNewConversationRef.current = false;
  };

  const handleNewConversation = (conversationId: string): void => {
    setLocalConversation(null);
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
    localConversation,
    currentConversationId,
    isNewConversationRef,
    updateConversation,
    handleNewConversation,
    navigateToConversation,
  };
}
