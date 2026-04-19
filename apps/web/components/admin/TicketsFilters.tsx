"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdminTicketEventOption,
  TicketStatus,
} from "@/lib/queries/admin/tickets";

interface TicketsFiltersProps {
  events: AdminTicketEventOption[];
  /** Total visible rows under the current filters (for the export hint). */
  resultCount: number;
}

const STATUS_OPTIONS: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const ALL_EVENTS_VALUE = "all";

const IST_OFFSET_MINUTES = 5 * 60 + 30;

/** Convert a UTC ISO string to the IST wall-clock value for `<input type="date">` (YYYY-MM-DD). */
function utcIsoToIstDateInput(iso: string | null): string {
  if (!iso) return "";
  const utc = new Date(iso);
  if (Number.isNaN(utc.getTime())) return "";
  const ist = new Date(utc.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

/** YYYY-MM-DD entered as IST midnight → UTC ISO for storage in URL params. */
function istDateInputToUtcIso(value: string, endOfDay: boolean): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d] = m;
  const istEpoch = endOfDay
    ? Date.UTC(Number(y), Number(mo) - 1, Number(d), 23, 59, 59, 999)
    : Date.UTC(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0);
  return new Date(istEpoch - IST_OFFSET_MINUTES * 60 * 1000).toISOString();
}

export function TicketsFilters({
  events,
  resultCount,
}: TicketsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentEventId = searchParams.get("event_id") ?? ALL_EVENTS_VALUE;
  const currentStatus = (searchParams.get("status") ?? "all") as
    | TicketStatus
    | "all";
  const currentFromIso = searchParams.get("from");
  const currentToIso = searchParams.get("to");

  const currentFromInput = useMemo(
    () => utcIsoToIstDateInput(currentFromIso),
    [currentFromIso],
  );
  const currentToInput = useMemo(
    () => utcIsoToIstDateInput(currentToIso),
    [currentToIso],
  );

  const hasAnyFilter =
    currentEventId !== ALL_EVENTS_VALUE ||
    currentStatus !== "all" ||
    Boolean(currentFromIso) ||
    Boolean(currentToIso);

  function pushParams(next: URLSearchParams): void {
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/admin/tickets?${qs}` : "/admin/tickets");
    });
  }

  function setParam(key: string, value: string | null): void {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    pushParams(next);
  }

  function handleClear(): void {
    pushParams(new URLSearchParams());
  }

  // Build the CSV export URL with the same filters.
  const exportHref = useMemo(() => {
    const next = new URLSearchParams();
    if (currentEventId !== ALL_EVENTS_VALUE) next.set("event_id", currentEventId);
    if (currentStatus !== "all") next.set("status", currentStatus);
    if (currentFromIso) next.set("from", currentFromIso);
    if (currentToIso) next.set("to", currentToIso);
    const qs = next.toString();
    return qs
      ? `/api/admin/tickets/export?${qs}`
      : "/api/admin/tickets/export";
  }, [currentEventId, currentStatus, currentFromIso, currentToIso]);

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <FieldLabel label="Event">
          <Select
            value={currentEventId}
            onValueChange={(v) =>
              setParam("event_id", v === ALL_EVENTS_VALUE ? null : v)
            }
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_EVENTS_VALUE}>All events</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>

        <FieldLabel label="Status">
          <Select
            value={currentStatus}
            onValueChange={(v) =>
              setParam("status", v === "all" ? null : v)
            }
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldLabel>

        <FieldLabel label="From (IST)">
          <Input
            type="date"
            value={currentFromInput}
            onChange={(e) =>
              setParam("from", istDateInputToUtcIso(e.target.value, false))
            }
            disabled={pending}
          />
        </FieldLabel>

        <FieldLabel label="To (IST)">
          <Input
            type="date"
            value={currentToInput}
            onChange={(e) =>
              setParam("to", istDateInputToUtcIso(e.target.value, true))
            }
            disabled={pending}
          />
        </FieldLabel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-3">
        <div className="text-sm text-neutral-600">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-2">
          {hasAnyFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={pending}
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear filters
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={exportHref}>
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </label>
      {children}
    </div>
  );
}
