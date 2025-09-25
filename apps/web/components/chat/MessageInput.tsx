"use client";

import React, { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { AttachmentArea } from "./AttachmentArea";
import { Badge } from "@/components/ui/badge";
import { type ImagePreview } from "@/lib/chat-utils-client";
import { IMAGE_UPLOAD_CONSTRAINTS, MODEL_CONFIG } from "@/lib/app-utils";
import { useChatState } from "@/contexts/ChatStateContext";

export function MessageInput() {
  // Get chat state from context
  const {
    input,
    handleInputChange,
    isLoading,
    isStreaming,
    isStopping,
    setIsStopping,
    attachmentPreviews: attachments,
    handleAttachmentsChange: onAttachmentsChange,
    stop,
    isSendDisabled,
  } = useChatState();

  const handleKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // Block submission when sending is disabled
      if (isSendDisabled) {
        return;
      }

      // Submit the closest form
      const form = e.currentTarget.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleStopClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsStopping(true);
    stop();
  };

  const handleImagesSelected = (images: ImagePreview[]) => {
    onAttachmentsChange([...attachments, ...images]);
  };

  // Get placeholder text based on current state
  const placeholderText = (): string => {
    if (isLoading) {
      return "Loading...";
    }

    if (isStreaming) {
      return "Type your next message...";
    }

    if (attachments.length > 0) {
      return "Add a message to your images...";
    }

    return "Type your message...";
  };

  // Determine button state and behavior
  const isStreamingOrStopping = isStreaming || isStopping;
  const canSend = input.trim() && !isSendDisabled;
  const canStop = isStreaming && !isStopping;

  return (
    <div className="space-y-3 mb-2">
      {/* Attachment Area - Show when images are attached */}
      {attachments.length > 0 && (
        <AttachmentArea
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          disabled={isSendDisabled}
        />
      )}

      {/* Text Input Row */}
      <div className="w-full">
        <Textarea
          placeholder={placeholderText()}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isSendDisabled}
          className="w-full text-md resize-none md:text-lg"
          rows={3}
        />
      </div>

      {/* Controls Row: Attachment + Model + Send/Stop */}
      <div className="flex items-center gap-3">
        <ImageUpload
          onImagesSelected={handleImagesSelected}
          currentImageCount={attachments.length}
          disabled={
            isSendDisabled ||
            attachments.length >= IMAGE_UPLOAD_CONSTRAINTS.MAX_FILES_PER_MESSAGE
          }
        />

        <Badge variant="outline">{MODEL_CONFIG.displayName}</Badge>

        {/* Spacer to push button to the right */}
        <div className="flex-1" />

        {/* Dynamic Send/Stop Button - Far Right */}
        {isStreamingOrStopping ? (
          <Button
            type="button"
            onClick={handleStopClick}
            disabled={!canStop}
            size="icon"
            variant="destructive"
            className="shrink-0"
            aria-label="Stop generating response"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!canSend}
            size="icon"
            className="shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
