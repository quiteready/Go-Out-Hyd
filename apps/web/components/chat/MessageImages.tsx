"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IMAGE_UPLOAD_CONSTRAINTS } from "@/lib/app-utils";
import { ImageModal } from "./ImageModal";

// Interface for displaying attachments
interface DisplayAttachment {
  id: string;
  name: string;
  signedUrl: string;
}

interface MessageImagesProps {
  attachments: DisplayAttachment[];
  className?: string;
}

export function MessageImages({ attachments, className }: MessageImagesProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleImageLoad = (url: string) => {
    setLoadedImages((prev) => new Set([...prev, url]));
  };

  const handleImageError = (url: string) => {
    setFailedImages((prev) => new Set([...prev, url]));
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setModalOpen(true);
  };

  // Filter out failed images
  const validAttachments = attachments.filter(
    (attachment) => !failedImages.has(attachment.signedUrl),
  );

  if (validAttachments.length === 0) {
    return null;
  }

  const getImageClasses = () => {
    return cn(
      "relative overflow-hidden rounded-lg bg-muted cursor-pointer transition-all duration-200",
      // Smaller thumbnails on mobile, scale up from sm+
      "w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0",
      "hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-primary/20",
    );
  };

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      {/* Images grid - Compact thumbnails */}
      <div
        className={cn(
          "flex flex-wrap gap-1.5 sm:gap-2 max-w-sm",
          validAttachments.length === 1 ? "justify-start" : "justify-start",
        )}
      >
        {validAttachments.map((attachment, index) => (
          <div
            key={attachment.id}
            className={getImageClasses()}
            onClick={() => handleImageClick(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleImageClick(index);
              }
            }}
            aria-label={`View full size image: ${attachment.name}`}
          >
            {/* Loading skeleton */}
            {!loadedImages.has(attachment.signedUrl) && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}

            {/* Image */}
            <Image
              src={attachment.signedUrl}
              alt={attachment.name}
              fill
              className={cn(
                "object-cover transition-opacity",
                loadedImages.has(attachment.signedUrl)
                  ? "opacity-100"
                  : "opacity-0",
              )}
              onLoad={() => handleImageLoad(attachment.signedUrl)}
              onError={() => handleImageError(attachment.signedUrl)}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
            />

            {/* Overlay with image info on hover */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors">
              <div className="absolute bottom-2 left-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                <div className="rounded bg-black/80 px-2 py-1 backdrop-blur-sm">
                  <p className="text-xs text-white truncate">
                    {attachment.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image count indicator for 4+ images */}
      {validAttachments.length >
        IMAGE_UPLOAD_CONSTRAINTS.MAX_FILES_PER_MESSAGE && (
        <p className="text-xs text-muted-foreground">
          {validAttachments.length} images attached
        </p>
      )}

      {/* Error state for failed images */}
      {failedImages.size > 0 && (
        <p className="text-xs text-destructive">
          {failedImages.size === 1
            ? "1 image failed to load"
            : `${failedImages.size} images failed to load`}
        </p>
      )}

      {/* Image Modal */}
      <ImageModal
        images={validAttachments.map((attachment) => ({
          id: attachment.id,
          url: attachment.signedUrl,
          name: attachment.name,
          alt: attachment.name,
        }))}
        initialIndex={selectedImageIndex}
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
