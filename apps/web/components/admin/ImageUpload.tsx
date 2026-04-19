"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  uploadImage,
  type UploadBucket,
} from "@/app/actions/admin/upload";

interface ImageUploadProps {
  bucket: UploadBucket;
  /** Current image URL, or null/empty if none. */
  value: string | null;
  /** Called with the new public URL after upload, or null when cleared. */
  onChange: (url: string | null) => void;
  label?: string;
  /** Hint text shown under the dropzone. */
  hint?: string;
  /** Optional alt text used for preview rendering only. */
  alt?: string;
  /** Disable the entire control. */
  disabled?: boolean;
  /** Aspect-ratio class for the preview container. Default: 16/9. */
  previewAspectClassName?: string;
}

export function ImageUpload({
  bucket,
  value,
  onChange,
  label = "Image",
  hint = "JPEG, PNG, WebP, or AVIF. Up to 5 MB. Recommended 1600×900 (16:9).",
  alt = "",
  disabled = false,
  previewAspectClassName = "aspect-[16/9]",
}: ImageUploadProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File): Promise<void> {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadImage(fd, bucket);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onChange(result.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed unexpectedly",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleClear(): void {
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-neutral-900">
        {label}
      </label>

      {value ? (
        <div className="space-y-2">
          <div
            className={`relative w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 ${previewAspectClassName}`}
          >
            <Image
              src={value}
              alt={alt}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Replace
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled || uploading}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center ${previewAspectClassName}`}
        >
          <Upload className="h-6 w-6 text-neutral-400" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Choose file"
            )}
          </Button>
        </div>
      )}

      <p className="text-xs text-neutral-500">{hint}</p>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
      />
    </div>
  );
}
