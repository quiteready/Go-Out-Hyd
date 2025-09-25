"use client";

import { useState } from "react";
import { type GroupedConversations } from "@/lib/history";
import { ConversationRow } from "./ConversationRow";

export function ConversationTable({
  conversations: initialConversations,
}: {
  conversations: GroupedConversations;
}) {
  const [conversations, setConversations] = useState(initialConversations);

  const sections = [
    { key: "today", title: "Today", data: conversations.today },
    { key: "yesterday", title: "Yesterday", data: conversations.yesterday },
    { key: "thisWeek", title: "This Week", data: conversations.thisWeek },
    { key: "older", title: "Older", data: conversations.older },
  ].filter((section) => section.data.length > 0);

  const handleConversationRenamed = (
    conversationId: string,
    newTitle: string,
  ) => {
    setConversations((prev) => {
      // Find which category contains the conversation and update only that one
      const categories = ["today", "yesterday", "thisWeek", "older"] as const;

      for (const category of categories) {
        const categoryConversations = prev[category];
        const conversationIndex = categoryConversations.findIndex(
          (conv) => conv.id === conversationId,
        );

        if (conversationIndex !== -1) {
          return {
            ...prev,
            [category]: categoryConversations.map((conv, index) =>
              index === conversationIndex ? { ...conv, title: newTitle } : conv,
            ),
          };
        }
      }

      // Conversation not found (shouldn't happen), return unchanged
      return prev;
    });
  };

  const handleConversationDeleted = (conversationId: string) => {
    setConversations((prev) => {
      // Find which category contains the conversation and remove from only that one
      const categories = ["today", "yesterday", "thisWeek", "older"] as const;

      for (const category of categories) {
        const categoryConversations = prev[category];
        const conversationIndex = categoryConversations.findIndex(
          (conv) => conv.id === conversationId,
        );

        if (conversationIndex !== -1) {
          return {
            ...prev,
            [category]: categoryConversations.filter(
              (conv) => conv.id !== conversationId,
            ),
          };
        }
      }

      // Conversation not found (shouldn't happen), return unchanged
      return prev;
    });
  };

  return (
    <div>
      <div className="rounded-md border">
        {/* Table Header */}
        <div className="border-b bg-muted/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-4 text-sm font-medium text-muted-foreground">
            <div>Name</div>
            <div className="hidden md:block">Date</div>
          </div>
        </div>

        {/* Conversation Sections */}
        <div className="divide-y">
          {sections.map((section) => (
            <div key={section.key}>
              {/* Section Header */}
              <div className="bg-muted/25 px-4 py-2 border-b">
                <h3 className="text-sm font-medium text-foreground">
                  {section.title}
                </h3>
              </div>

              {/* Section Conversations */}
              <div className="divide-y">
                {section.data.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    onRenamed={handleConversationRenamed}
                    onDeleted={handleConversationDeleted}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
