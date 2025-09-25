"use client";

import { ChatMessages } from "./ChatMessages";
import { MessageInput } from "./MessageInput";
import { cn } from "@/lib/utils";
import { useChatState } from "@/contexts/ChatStateContext";
import { useSidebar } from "../ui/sidebar";

export function ChatContainer() {
  const { handleFormSubmit } = useChatState();
  const { isMobile, state: sidebarState } = useSidebar();

  return (
    <>
      {/* Messages Area - Scrollable with fixed bottom padding for input */}
      <div className="h-full w-full overflow-y-auto pb-40 sm:pb-48">
        <div className="w-full max-w-4xl mx-auto">
          <ChatMessages />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-40 bg-background transition-[left] duration-200 ease-linear",
          isMobile
            ? "left-0"
            : sidebarState === "collapsed"
              ? "left-16"
              : "left-64",
        )}
      >
        <div className={cn("w-full px-4", isMobile ? "pb-2" : "pb-4")}>
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleFormSubmit}>
              <MessageInput />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
