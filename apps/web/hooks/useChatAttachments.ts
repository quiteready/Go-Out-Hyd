import { useState } from "react";
import { type ImagePreview } from "@/lib/chat-utils-client";

export function useChatAttachments(): {
  selectedFiles: File[];
  attachmentPreviews: ImagePreview[];
  handleAttachmentsChange: (newAttachments: ImagePreview[]) => void;
  clearAttachments: () => void;
} {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<ImagePreview[]>(
    [],
  );

  const handleAttachmentsChange = (newAttachments: ImagePreview[]): void => {
    const files = newAttachments.map((img) => img.file);
    setSelectedFiles(files);
    setAttachmentPreviews(newAttachments);
  };

  const clearAttachments = (): void => {
    setSelectedFiles([]);
    setAttachmentPreviews([]);
  };

  return {
    selectedFiles,
    attachmentPreviews,
    handleAttachmentsChange,
    clearAttachments,
  };
}
