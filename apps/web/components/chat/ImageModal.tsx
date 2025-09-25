"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageData {
  id: string;
  url: string;
  name: string;
  alt?: string;
}

interface ImageModalProps {
  images: ImageData[];
  initialIndex?: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageModal({
  images,
  initialIndex = 0,
  isOpen,
  onOpenChange,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset state when modal opens/closes or images change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, initialIndex, images]);

  const currentImage = images[currentIndex];

  const goToPrevious = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      setIsLoading(true);
      setHasError(false);
    }
  }, [images.length]);

  const goToNext = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      setIsLoading(true);
      setHasError(false);
    }
  }, [images.length]);

  // Enhanced keyboard navigation with better accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Prevent default behavior for handled keys
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          event.preventDefault();
          goToNext();
          break;
        case "Escape":
          event.preventDefault();
          onOpenChange(false);
          break;
        case " ": // Spacebar
          event.preventDefault();
          goToNext();
          break;
        case "Home":
          if (images.length > 1) {
            event.preventDefault();
            setCurrentIndex(0);
            setIsLoading(true);
            setHasError(false);
          }
          break;
        case "End":
          if (images.length > 1) {
            event.preventDefault();
            setCurrentIndex(images.length - 1);
            setIsLoading(true);
            setHasError(false);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onOpenChange, images.length]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none max-w-none max-h-none w-screen h-screen flex items-center justify-center"
        showCloseButton={false}
        // Enhanced accessibility
        aria-describedby={
          images.length > 1 ? "image-gallery-description" : "image-description"
        }
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            {currentImage.name ||
              `Image ${currentIndex + 1} of ${images.length}`}
          </DialogTitle>
        </DialogHeader>

        {/* Screen reader description */}
        <div id="image-description" className="sr-only">
          Viewing image: {currentImage.name || "Untitled"}
        </div>
        {images.length > 1 && (
          <div id="image-gallery-description" className="sr-only">
            Image gallery: {currentIndex + 1} of {images.length}. Use arrow keys
            to navigate.
          </div>
        )}

        {/* Click-to-close overlay */}
        <div
          className="absolute inset-0 z-0"
          onClick={() => onOpenChange(false)}
          aria-label="Close image modal"
        />

        {/* Image container */}
        <div className="relative z-10 max-w-[95vw] max-h-[95vh] flex items-center justify-center">
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-white/90 mb-3">Failed to load image</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLoading(true);
                    setHasError(false);
                    const img = document.querySelector(
                      `img[alt="${currentImage.alt || currentImage.name}"]`,
                    ) as HTMLImageElement;
                    if (img) {
                      img.src = currentImage.url;
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Main Image */}
          <Image
            src={currentImage.url}
            alt={currentImage.alt || currentImage.name || "Image"}
            width={1600}
            height={1200}
            className={cn(
              "max-w-full max-h-full w-auto h-auto object-contain cursor-pointer transition-opacity duration-300",
              isLoading || hasError ? "opacity-0" : "opacity-100",
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={() => onOpenChange(false)}
            priority
            sizes="95vw"
            tabIndex={-1}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
