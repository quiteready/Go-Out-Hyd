"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteCafe } from "@/app/actions/admin/cafes";

interface DeleteCafeButtonProps {
  cafeId: string;
  cafeName: string;
}

export function DeleteCafeButton({ cafeId, cafeName }: DeleteCafeButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleDelete(): Promise<void> {
    const result = await deleteCafe(cafeId);
    if (!result.success) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Cafe deleted");
    startTransition(() => {
      router.push("/admin/cafes");
    });
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" disabled={pending}>
          <Trash2 className="mr-1.5 h-4 w-4 text-red-600" />
          Delete cafe
        </Button>
      }
      title="Delete this cafe?"
      description={
        <>
          This will permanently delete <strong>{cafeName}</strong> and
          cascade-delete its menu items, gallery images, and any events with no
          paid tickets. Events with paid tickets block the delete.
        </>
      }
      confirmLabel="Delete cafe"
      destructive
      onConfirm={handleDelete}
    />
  );
}
