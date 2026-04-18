import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { getTicketByCode } from "@/lib/queries/tickets";

export const metadata: Metadata = {
  title: "Booking Confirmation | GoOut Hyd",
};

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

function formatEventDate(date: Date): string {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function generateQrDataUrl(ticketCode: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(ticketCode, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1C1008",
        light: "#FFFCF7",
      },
    });
  } catch {
    return null;
  }
}

export default async function BookingConfirmationPage({ searchParams }: PageProps) {
  const { code } = await searchParams;

  if (!code) notFound();

  const ticket = await getTicketByCode(code);
  if (!ticket) notFound();

  // Pending: payment hasn't been verified yet
  if (ticket.status !== "paid") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-heading text-3xl text-espresso">Payment pending</h1>
        <p className="mt-4 text-roast/80">
          We have not received confirmation of your payment yet. If money was
          deducted, it will appear once our payment provider confirms. Please do
          not retry — contact us if this persists.
        </p>
        <Button asChild className="mt-6 bg-caramel text-foam hover:bg-caramel/90">
          <Link href="/events">Back to events</Link>
        </Button>
      </div>
    );
  }

  const qrDataUrl = await generateQrDataUrl(ticket.ticketCode);
  const venueLine = ticket.event.cafe
    ? `${ticket.event.cafe.name}, ${ticket.event.cafe.area}`
    : "Venue TBC";

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="rounded-lg border border-sand bg-foam p-6 shadow-sm sm:p-10">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-caramel/15 px-4 py-1 text-sm font-medium text-caramel">
            Confirmed
          </span>
          <h1 className="mt-4 font-heading text-3xl text-espresso sm:text-4xl">
            Your ticket is ready
          </h1>
          <p className="mt-2 text-roast/80">
            Show this QR code at the venue entrance.
          </p>
        </div>

        {qrDataUrl && (
          <div className="mt-8 flex justify-center">
            <div className="rounded-lg border-4 border-caramel bg-foam p-3">
              <Image
                src={qrDataUrl}
                alt="Ticket QR Code"
                width={240}
                height={240}
                unoptimized
              />
            </div>
          </div>
        )}

        <p className="mt-3 text-center font-mono text-xs text-roast/60">
          {ticket.ticketCode}
        </p>

        <dl className="mt-8 space-y-3 border-t border-sand pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-roast/70">Event</dt>
            <dd className="text-right font-medium text-espresso">
              {ticket.event.title}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-roast/70">Date</dt>
            <dd className="text-right font-medium text-espresso">
              {formatEventDate(ticket.event.startTime)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-roast/70">Venue</dt>
            <dd className="text-right font-medium text-espresso">{venueLine}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-roast/70">Name</dt>
            <dd className="text-right font-medium text-espresso">
              {ticket.customerName}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-roast/70">Tickets</dt>
            <dd className="text-right font-medium text-espresso">
              {ticket.quantity}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-roast/70">Amount paid</dt>
            <dd className="text-right font-medium text-espresso">
              ₹{ticket.amountPaid}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-center text-sm text-roast/70">
          A copy of this ticket has been emailed to{" "}
          <span className="font-medium text-espresso">
            {ticket.customerEmail}
          </span>
          .
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline">
            <Link href="/events">Browse more events</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
