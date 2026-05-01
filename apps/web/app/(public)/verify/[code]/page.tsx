import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getTicketByCode } from "@/lib/queries/tickets";

export const metadata: Metadata = {
  title: "Ticket Verification | GoOut Hyd",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ code: string }>;
}

function formatEventDate(date: Date): string {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function VerifyTicketPage({ params }: PageProps) {
  const { code } = await params;
  const ticket = await getTicketByCode(code);
  if (!ticket) notFound();

  const isValid = ticket.status === "paid";
  const venueLine = ticket.event.cafe
    ? `${ticket.event.cafe.name}, ${ticket.event.cafe.area}`
    : "Venue TBC";

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div
        className={`rounded-lg border p-6 text-center shadow-sm ${
          isValid
            ? "border-[#fbf497]/40 bg-card"
            : "border-red-300 bg-red-50"
        }`}
      >
        <div
          className={`inline-flex rounded-full px-4 py-1 text-sm font-semibold ${
            isValid
              ? "bg-[#fbf497]/20 text-[#0a0a0a]"
              : "bg-red-200 text-red-800"
          }`}
        >
          {isValid ? "VALID TICKET" : "NOT PAID"}
        </div>
        <h1 className="mt-4 text-2xl font-medium text-foreground sm:text-3xl">
          {ticket.event.title}
        </h1>

        <dl className="mt-6 space-y-3 border-t border-sand pt-6 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-right font-medium text-foreground">
              {ticket.customerName}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tickets</dt>
            <dd className="text-right font-medium text-foreground">
              {ticket.quantity}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Date</dt>
            <dd className="text-right font-medium text-foreground">
              {formatEventDate(ticket.event.startTime)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Venue</dt>
            <dd className="text-right font-medium text-foreground">
              {venueLine}
            </dd>
          </div>
        </dl>

        <p className="mt-6 font-mono text-xs text-foreground/40">
          {ticket.ticketCode.slice(0, 8)}…{ticket.ticketCode.slice(-4)}
        </p>
      </div>
    </div>
  );
}
