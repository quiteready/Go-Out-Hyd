"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { WelcomeCard } from "./WelcomeCard";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { useChatState } from "@/contexts/ChatStateContext";

export function ChatMessages() {
  const { messages, isLoading } = useChatState();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="w-full min-h-full p-4 space-y-6 sm:space-y-4 flex flex-col justify-end">
      {messages.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <WelcomeCard />
        </div>
      ) : (
        <>
          {/* Spacer to push messages to bottom when there are few messages */}
          <div className="flex-1 min-h-0" />

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* If the user sent a message, show the thinking indicator */}
          {isLoading && <ThinkingIndicator />}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
