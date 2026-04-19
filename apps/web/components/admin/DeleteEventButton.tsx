"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteEvent } from "@/app/actions/admin/events";

interface DeleteEventButtonProps {
  eventId: string;
  eventTitle: string;
}

export function DeleteEventButton({
  eventId,
  eventTitle,
}: DeleteEventButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleDelete(): Promise<void> {
    const result = await deleteEvent(eventId);
    if (!result.success) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Event deleted");
    startTransition(() => {
      router.push("/admin/events");
    });
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" disabled={pending}>
          <Trash2 className="mr-1.5 h-4 w-4 text-red-600" />
          Delete event
        </Button>
      }
      title="Delete this event?"
      description={
        <>
          This will permanently delete <strong>{eventTitle}</strong>. Events
          with paid tickets cannot be deleted — cancel them instead.
        </>
      }
      confirmLabel="Delete event"
      destructive
      onConfirm={handleDelete}
    />
  );
}
