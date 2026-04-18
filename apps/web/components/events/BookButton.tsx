"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { BookingModal } from "./BookingModal";

type EventForBooking = {
  id: string;
  title: string;
  ticketPrice: number;
  slug: string;
};

interface BookButtonProps {
  event: EventForBooking;
}

export function BookButton({ event }: BookButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="mt-4 w-full bg-caramel text-foam hover:bg-caramel/90"
        onClick={() => setOpen(true)}
      >
        Book Now — ₹{event.ticketPrice}
      </Button>
      <BookingModal event={event} open={open} onOpenChange={setOpen} />
    </>
  );
}
