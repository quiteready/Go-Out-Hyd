"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type TextUIPart, type FileUIPart } from "ai";
import { type Conversation } from "@/lib/drizzle/schema";
import { saveMessage } from "@/app/actions/chat";
import { useUser } from "@/contexts/UserContext";
import { useUsage } from "@/contexts/UsageContext";
import { type ImagePreview } from "@/lib/chat-utils-client";
import { toast } from "sonner";

import { type ExtendedMessage } from "@/lib/chat-utils";

import {
  useChatAttachments,
  useChatConversation,
  useChatStreaming,
} from "@/hooks";

// Context interface
interface ChatStateContextType {
  // Attachments
  attachmentPreviews: ImagePreview[];
  handleAttachmentsChange: (newAttachments: ImagePreview[]) => void;

  // Streaming
  isStreaming: boolean;
  isStopping: boolean;
  setIsStopping: (value: boolean) => void;

  // Chat functionality
  messages: ExtendedMessage[];
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  setInput: (value: string) => void;
  setMessages: (messages: ExtendedMessage[]) => void;
  stop: () => void;
  error: Error | undefined;
  status: "ready" | "submitted" | "streaming" | "error";
  regenerate: () => void;
  isLoading: boolean;
  handleFormSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;

  // Disabled states
  isSendDisabled: boolean;
}

// Create context
const ChatStateContext = createContext<ChatStateContextType | undefined>(
  undefined,
);

// Provider component
interface ChatStateProviderProps {
  children: React.ReactNode;
  conversation: Conversation | null;
  initialMessages: ExtendedMessage[];
}

export function ChatStateProvider({
  children,
  conversation,
  initialMessages,
}: ChatStateProviderProps) {
  const { id: userId } = useUser();
  const { refreshUsage, loading: usageLoading, canSendMessage } = useUsage();

  // Initialize specialized hooks
  const attachments = useChatAttachments();
  const conversationHook = useChatConversation(conversation);
  const streaming = useChatStreaming(conversationHook.currentConversationId);

  // Manual input state management for v5
  const [input, setInput] = useState("");

  // Manual input change handler
  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setInput(e.target.value);
  };

  // Main useChat hook with v5 DefaultChatTransport
  const {
    messages: rawMessages,
    setMessages: setRawMessages,
    status,
    sendMessage,
    stop,
    error,
    regenerate,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      /**
       * Transform requests to include required data for our API route with trigger detection
       * - Our API route expects: { messages: [...], data: { conversationId, trigger } }
       */
      prepareSendMessagesRequest: ({ messages, trigger }) => {
        const conversationId = conversationHook.currentConversationId.current;

        if (!conversationId) {
          console.error("No conversationId available for chat request");
          throw new Error("No conversation available");
        }

        return {
          body: {
            messages,
            data: {
              conversationId,
              trigger,
            },
          },
        };
      },
    }),
    // Throttle UI updates to prevent "Maximum update depth exceeded" errors during streaming
    experimental_throttle: 50,
    onError(error) {
      console.error("Chat error:", error);

      // Display the error message directly from the API
      const errorMessage =
        error.message || "An error occurred. Please try again.";
      toast.error(errorMessage);

      // Refresh usage stats if it's a usage-related error
      if (errorMessage.includes("Usage limit exceeded")) {
        refreshUsage();
      }

      // Reset streaming states on error (only the ones we control)
      streaming.setIsStopping(false);
      streaming.abortControllerRef.current = null;
    },
    async onFinish() {
      // Reset streaming states (only the ones we control)
      streaming.setIsStopping(false);
      streaming.abortControllerRef.current = null;

      // Refresh usage stats after successful message (the API route records the event)
      refreshUsage();
    },
  });

  // Initialize messages from props
  useEffect(() => {
    if (initialMessages) {
      setRawMessages(initialMessages);
    }
  }, [initialMessages, setRawMessages]);

  // Cast raw messages to ExtendedMessages (they already have the correct v5 structure)
  const messages: ExtendedMessage[] = (rawMessages || []) as ExtendedMessage[];

  // Wrapper for setMessages that handles the ExtendedMessage type
  const setMessages = (newMessages: ExtendedMessage[]): void => {
    setRawMessages(newMessages);
  };

  // Derive streaming state directly from useChat status to prevent loops
  const isStreaming = status === "streaming";
  const isLoading = status === "submitted";

  // Reset stopping state when streaming stops and refresh usage for aborted streams
  useEffect(() => {
    if (!isStreaming && streaming.isStopping) {
      streaming.setIsStopping(false);
      refreshUsage();
    }
  }, [isStreaming, streaming.isStopping, refreshUsage]);

  // Form submission logic
  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!userId) return;

    // Block submission when usage limits or prerequisites prevent sending
    const usageGate = canSendMessage();
    if (usageLoading || isStreaming || isLoading || !usageGate.canSend) {
      toast.error(
        usageGate.reason || "Usage limit reached. Upgrade to continue.",
      );
      return;
    }

    // Always require text input, regardless of attachments
    if (!input.trim()) {
      toast.error(
        "Please enter a text query. Text is required for all searches.",
      );
      return;
    }

    // If currently streaming, stop and save partial response first
    if (isStreaming) {
      await streaming.savePartialResponseAndStop(stop);
      // Small delay to ensure stop completes before starting new request
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const userInput = input;
    const filesToUpload = [...attachments.selectedFiles];

    // Clear the input and attachments immediately after capturing them
    setInput("");
    attachments.clearAttachments();

    try {
      // Save user message (creates conversation if needed)
      const result = await saveMessage(
        conversationHook.localConversation?.id || null,
        userInput,
        filesToUpload,
      );

      if (!result.success) {
        console.error("Conversation/message creation failed:", result.error);
        toast.error(result.error || "Failed to create message");
        return;
      }

      // Update local conversation state if this was a new conversation
      if (result.isNewConversation && result.conversationId) {
        conversationHook.handleNewConversation(result.conversationId);

        // Navigate to the conversation before streaming starts
        conversationHook.navigateToConversation();
      }

      // Create new AbortController for this request
      streaming.createNewAbortController();

      // Prepare message content for streaming with v5 parts structure
      const messageParts: Array<TextUIPart | FileUIPart> = [
        {
          type: "text",
          text: userInput,
        },
      ];

      // Add file parts for v5 structure
      if (result.attachments && result.attachments.length > 0) {
        result.attachments.forEach((attachment) => {
          messageParts.push({
            type: "file",
            mediaType: attachment.contentType,
            url: attachment.signedUrl,
            filename: attachment.name,
          });
        });
      }

      // Start AI streaming with v5 message structure using sendMessage
      await sendMessage({
        role: "user",
        parts: messageParts,
      });
    } catch (error) {
      console.error("❌ Error in form submission:", error);
      toast.error("Failed to create message");
    }
  };

  // Determine if sending/regenerating should be disabled based on global usage check
  const usageGate = canSendMessage();
  const isSendDisabled =
    usageLoading || isLoading || isStreaming || !usageGate.canSend;

  const contextValue: ChatStateContextType = {
    // Attachments
    attachmentPreviews: attachments.attachmentPreviews,
    handleAttachmentsChange: attachments.handleAttachmentsChange,

    // Streaming (only externally used values)
    isStreaming,
    isStopping: streaming.isStopping,
    setIsStopping: streaming.setIsStopping,

    // Chat functionality (only externally used values)
    messages,
    input,
    handleInputChange,
    setInput,
    setMessages,
    stop,
    error,
    status,
    regenerate,
    isLoading,
    handleFormSubmit,

    // Disabled states
    isSendDisabled,
  };

  return (
    <ChatStateContext.Provider value={contextValue}>
      {children}
    </ChatStateContext.Provider>
  );
}

// Hook to use the context
export function useChatState(): ChatStateContextType {
  const context = useContext(ChatStateContext);
  if (context === undefined) {
    throw new Error("useChatState must be used within a ChatStateProvider");
  }
  return context;
}
