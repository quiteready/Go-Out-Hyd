"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DisabledRefundButton } from "@/components/admin/DisabledRefundButton";
import { cancelEvent } from "@/app/actions/admin/events";

interface CancelEventButtonProps {
  eventId: string;
  eventTitle: string;
  ticketsSold: number;
  /** Hide entirely when already cancelled. */
  alreadyCancelled?: boolean;
}

export function CancelEventButton({
  eventId,
  eventTitle,
  ticketsSold,
  alreadyCancelled = false,
}: CancelEventButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (alreadyCancelled) return null;

  async function handleCancel(): Promise<void> {
    const result = await cancelEvent(eventId);
    if (!result.success) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Event cancelled");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" disabled={pending}>
          <Ban className="mr-1.5 h-4 w-4 text-amber-600" />
          Cancel event
        </Button>
      }
      title="Cancel this event?"
      description={
        <div className="space-y-3">
          <p>
            <strong>{eventTitle}</strong> will be marked as cancelled and a
            cancelled banner will appear on its public page. The booking button
            will be hidden.
          </p>
          {ticketsSold > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">
                {ticketsSold} paid ticket{ticketsSold === 1 ? "" : "s"} on
                this event.
              </p>
              <p className="mt-1">
                Refunds must be processed manually via the Razorpay dashboard
                for now.
              </p>
              <div className="mt-2">
                <DisabledRefundButton
                  label="Refund all tickets"
                  size="sm"
                />
              </div>
            </div>
          )}
        </div>
      }
      confirmLabel="Cancel event"
      destructive
      onConfirm={handleCancel}
    />
  );
}
