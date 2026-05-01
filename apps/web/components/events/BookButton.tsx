"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { BookingModal } from "./BookingModal";

export type EventForBooking = {
  id: string;
  title: string;
  slug: string;
  /** Per-ticket amount charged at checkout (early bird or regular). */
  payablePrice: number;
  /** Regular price when early bird is active (shown struck-through in UI). */
  listPrice?: number;
};

interface BookButtonProps {
  event: EventForBooking;
}

export function BookButton({ event }: BookButtonProps) {
  const [open, setOpen] = useState(false);
  const showStrike =
    event.listPrice !== undefined && event.listPrice > event.payablePrice;

  return (
    <>
      <Button
        size="lg"
        className="mt-4 w-full bg-[#0a0a0a] text-[#fbf497] hover:bg-[#0a0a0a]/90"
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>Book Now —</span>
          {showStrike ? (
            <>
              <span className="font-semibold">₹{event.payablePrice}</span>
              <span className="text-sm text-foam/80 line-through">
                ₹{event.listPrice}
              </span>
              <span className="rounded bg-[#fbf497]/20 px-1.5 text-xs font-medium text-[#0a0a0a]">
                Early bird
              </span>
            </>
          ) : (
            <span className="font-semibold">₹{event.payablePrice}</span>
          )}
        </span>
      </Button>
      <BookingModal event={event} open={open} onOpenChange={setOpen} />
    </>
  );
}
