import React from "react";
import { MessageImages } from "./MessageImages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ExtendedMessage } from "@/lib/chat-utils";
import {
  type DisplayAttachment,
  convertDatabaseAttachmentsToDisplay,
} from "@/lib/attachments-client";
import { useChatState } from "@/contexts/ChatStateContext";
import { AssistantLabel } from "./AssistantLabel";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: ExtendedMessage }) {
  const isUser = message.role === "user";
  const { isStreaming, messages, error, status, regenerate, isSendDisabled } =
    useChatState();

  // Determine if this message is currently being streamed (the latest assistant message)
  const isCurrentlyStreaming =
    isStreaming &&
    !isUser &&
    messages.length > 0 &&
    messages[messages.length - 1]?.id === message.id;

  /**
   * Error Detection Logic - Handle 3 different error scenarios:
   *
   * SCENARIO 1: API error before assistant message is created (e.g., insufficient credits)
   * - User sends message → API fails immediately → No assistant message exists
   * - Show error bubble AFTER the user message that caused the failure
   *
   * SCENARIO 2: Assistant message exists but failed during generation
   * - Assistant message was created → Generation failed partway through
   * - Show error bubble IN PLACE OF the failed assistant message
   *
   * SCENARIO 3: Database error message (persisted from previous session)
   * - Error message was saved to database when AI generation failed
   * - Show error bubble for assistant message with status="error" from database
   * - Survives page refreshes and allows regenerate functionality
   */
  const isLastMessage =
    messages.length > 0 && messages[messages.length - 1]?.id === message.id;

  // Check if this is the last assistant message (for regenerate button on successful messages)
  const isLastAssistantMessage = !isUser && isLastMessage;

  // Get attachments from multiple sources and convert to display format
  let attachmentsToDisplay: DisplayAttachment[] = [];

  // Priority 1: Database attachments (most reliable)
  if (message.attachments?.length) {
    attachmentsToDisplay = convertDatabaseAttachmentsToDisplay(
      message.attachments,
    );
  }
  // Priority 2: v5 file parts
  else if (message.parts?.some((part) => part.type === "file")) {
    const fileParts = message.parts.filter(
      (
        part,
      ): part is {
        type: "file";
        mediaType: string;
        url: string;
        filename?: string;
      } => part.type === "file",
    );
    attachmentsToDisplay = fileParts
      .filter((part) => part.url) // Only include parts with valid URLs
      .map((part) => ({
        id: `${message.id}-${part.filename || "file"}`,
        name: part.filename || "file",
        contentType: part.mediaType || "application/octet-stream",
        signedUrl: part.url!,
      }));
  }

  // Extract text content to check if we should show the message card
  const textContent = message.parts
    ? message.parts
        .filter(
          (part): part is { type: "text"; text: string } =>
            part.type === "text",
        )
        .map((part) => part.text)
        .join("")
    : "";

  // Consolidated error scenarios
  const isAssistantError =
    !isUser &&
    (message.status === "error" ||
      (isLastMessage && status === "error" && error));

  // Scenario 1: the API failed and no assistant message was created →
  // show an error bubble immediately AFTER the last user message
  const showErrorAfterUserMessage =
    isUser && isLastMessage && status === "error" && error;

  const renderErrorBubble = () => {
    return (
      <div className="flex justify-start mt-4">
        <div className="max-w-[80%]">
          <AssistantLabel />

          {/* error card */}
          <Card className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 dark:border-red-500/50 dark:bg-red-500/10">
            <p className="text-sm font-medium text-destructive dark:text-red-500">
              Something went wrong and please try again
            </p>
          </Card>

          {/* regenerate button */}
          <Button
            onClick={regenerate}
            disabled={isSendDisabled}
            variant="outline"
            size="sm"
            className="px-1 text-destructive hover:text-destructive/80 hover:bg-transparent border-none bg-transparent shadow-none transition-colors dark:text-red-500 dark:hover:text-red-500/80 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
        </div>
      </div>
    );
  };

  // SCENARIO 2: Replace failed assistant message with error bubble
  if (isAssistantError) {
    return renderErrorBubble();
  }

  // Main message rendering (normal flow)
  const mainMessage = (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%]", isUser && "flex flex-col items-end")}>
        {/* Model label for assistant messages */}
        {!isUser && <AssistantLabel />}

        {/* Message content - only show if there's actual text content */}
        {textContent.trim() && (
          <Card
            className={cn(
              "p-4 max-w-full inline-block w-fit",
              isUser
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted",
              isLastAssistantMessage && !isCurrentlyStreaming && "mb-4",
            )}
          >
            <div className="flex items-start gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <div
                  className={`prose prose-sm max-w-none break-anywhere-constrained ${isUser ? "text-primary-foreground [&>*]:text-primary-foreground" : "text-foreground [&>*]:text-foreground"}`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: (props) => (
                        <p
                          className={`mb-2 last:mb-0 break-anywhere ${isUser ? "text-primary-foreground" : "text-foreground"}`}
                          {...props}
                        />
                      ),
                      ul: (props) => (
                        <ul
                          className={`list-disc pl-5 mb-2 ${isUser ? "text-primary-foreground" : "text-foreground"}`}
                          {...props}
                        />
                      ),
                      ol: (props) => (
                        <ol
                          className={`list-decimal pl-5 mb-2 ${isUser ? "text-primary-foreground" : "text-foreground"}`}
                          {...props}
                        />
                      ),
                      li: (props) => (
                        <li
                          className={`pl-2 break-anywhere ${isUser ? "text-primary-foreground" : "text-foreground"}`}
                          {...props}
                        />
                      ),
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                          <div className="relative my-2 rounded-md bg-gray-900 text-white max-w-full overflow-hidden">
                            <pre className="p-4 text-sm overflow-x-auto max-w-full whitespace-pre-wrap break-words">
                              <code className="break-code-block" {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        ) : (
                          <code
                            className="bg-gray-200 dark:bg-gray-700 rounded-sm px-1 py-0.5 text-sm text-black dark:text-white break-code inline-block"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {textContent}
                  </ReactMarkdown>
                </div>
              </div>
              {isUser && (
                <User
                  className="h-4 w-4 mt-1 text-primary-foreground"
                  strokeWidth={2.5}
                />
              )}
            </div>
          </Card>
        )}

        {/* Display attached images for user messages - BELOW the text */}
        {isUser && attachmentsToDisplay.length > 0 && (
          <div className="mt-2 flex justify-end w-full">
            <MessageImages
              attachments={attachmentsToDisplay}
              className="inline-block"
            />
          </div>
        )}

        {/* Regenerate button for successful assistant messages */}
        {isLastAssistantMessage && !isCurrentlyStreaming && (
          <div className="flex justify-start">
            <Button
              onClick={regenerate}
              disabled={isSendDisabled}
              variant="outline"
              size="sm"
              className="px-2 py-1 h-auto text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border-muted-foreground/20 bg-transparent shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // SCENARIO 1: Show user message + error bubble below it
  if (showErrorAfterUserMessage) {
    return (
      <>
        {mainMessage}
        {renderErrorBubble()}
      </>
    );
  }

  // Normal case: just show the message
  return mainMessage;
}
