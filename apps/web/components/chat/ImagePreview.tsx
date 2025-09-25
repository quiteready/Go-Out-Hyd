"use client";

import { useState } from "react";
import Image from "next/image";
import { X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/chat-utils-client";
import { ImageModal } from "./ImageModal";

interface ImagePreviewProps {
  id: string;
  preview: string;
  name: string;
  size: number;
  onRemove: (id: string) => void;
  className?: string;
}

export function ImagePreview({
  id,
  preview,
  name,
  size,
  onRemove,
  className,
}: ImagePreviewProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    // Prevent the remove button click from triggering
    if ((e.target as HTMLElement).closest("button")) return;
    setModalOpen(true);
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Image preview */}
      <div
        className="relative overflow-hidden rounded-lg border bg-muted cursor-pointer"
        onClick={handleImageClick}
      >
        <Image
          src={preview}
          alt={`Preview of ${name}`}
          width={80}
          height={80}
          className="h-20 w-20 object-cover transition-all duration-200 group-hover:scale-105 group-hover:shadow-md"
          loading="lazy"
        />

        {/* Remove button */}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute right-1 top-1 h-5 w-5 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 shadow-sm"
          onClick={() => onRemove(id)}
          aria-label={`Remove ${name}`}
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Loading overlay could be added here if needed */}
      </div>

      {/* File info */}
      <div className="mt-1 space-y-0.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileImage className="h-3 w-3 flex-shrink-0" />
          <span className="truncate max-w-16" title={name}>
            {name}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatFileSize(size)}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        images={[
          {
            id,
            url: preview,
            name,
            alt: `Preview of ${name}`,
          },
        ]}
        initialIndex={0}
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
