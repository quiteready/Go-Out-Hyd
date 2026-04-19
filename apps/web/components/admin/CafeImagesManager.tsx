"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  addCafeImage,
  updateCafeImage,
  deleteCafeImage,
  reorderCafeImage,
} from "@/app/actions/admin/cafe-images";
import type { CafeImage } from "@/lib/drizzle/schema";

interface CafeImagesManagerProps {
  cafeId: string;
  images: CafeImage[];
}

export function CafeImagesManager({ cafeId, images }: CafeImagesManagerProps) {
  const router = useRouter();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAlt, setDraftAlt] = useState("");
  const [pending, startTransition] = useTransition();

  function handleUploaded(url: string | null): void {
    if (!url) {
      setPendingUrl(null);
      return;
    }
    startTransition(async () => {
      const result = await addCafeImage(cafeId, { imageUrl: url });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Image added");
      setPendingUrl(null);
      router.refresh();
    });
  }

  function startEditAlt(image: CafeImage): void {
    setEditingId(image.id);
    setDraftAlt(image.altText ?? "");
  }

  function cancelEditAlt(): void {
    setEditingId(null);
    setDraftAlt("");
  }

  function saveAlt(id: string): void {
    startTransition(async () => {
      const result = await updateCafeImage(id, { altText: draftAlt || undefined });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Alt text updated");
      cancelEditAlt();
      router.refresh();
    });
  }

  function handleReorder(id: string, direction: "up" | "down"): void {
    startTransition(async () => {
      const result = await reorderCafeImage(id, direction);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete(id: string): Promise<void> {
    const result = await deleteCafeImage(id);
    if (!result.success) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Image removed");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <ImageUpload
          bucket="cafe-images"
          value={pendingUrl}
          onChange={handleUploaded}
          label="Add a gallery image"
          hint="Uploads append to the end of the gallery."
          disabled={pending}
        />
      </div>

      {images.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          No gallery images yet.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === images.length - 1;
            const isEditing = editingId === image.id;
            return (
              <li
                key={image.id}
                className="overflow-hidden rounded-md border border-neutral-200 bg-white"
              >
                <div className="relative aspect-[4/3] w-full bg-neutral-100">
                  <Image
                    src={image.imageUrl}
                    alt={image.altText ?? ""}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="space-y-2 p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={draftAlt}
                        onChange={(e) => setDraftAlt(e.target.value)}
                        placeholder="Alt text"
                        disabled={pending}
                      />
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditAlt}
                          disabled={pending}
                        >
                          <X className="mr-1.5 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveAlt(image.id)}
                          disabled={pending}
                        >
                          {pending ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-1.5 h-4 w-4" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditAlt(image)}
                      className="block w-full text-left text-xs text-neutral-600 hover:text-neutral-900"
                      disabled={pending}
                    >
                      {image.altText ? (
                        <span>{image.altText}</span>
                      ) : (
                        <span className="italic text-neutral-400">
                          Add alt text…
                        </span>
                      )}
                    </button>
                  )}
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isFirst || pending}
                        onClick={() => handleReorder(image.id, "up")}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isLast || pending}
                        onClick={() => handleReorder(image.id, "down")}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Delete image"
                          disabled={pending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      }
                      title="Remove image?"
                      description="This image will be removed from the gallery. The file in storage is not deleted."
                      confirmLabel="Remove"
                      destructive
                      onConfirm={() => handleDelete(image.id)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
