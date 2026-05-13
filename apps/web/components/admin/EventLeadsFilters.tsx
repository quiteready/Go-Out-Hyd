"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadStatusValue } from "@/lib/validations/admin/lead";

interface EventLeadsFiltersProps {
  resultCount: number;
}

const ALL_VALUE = "all";
const STATUS_OPTIONS: { value: LeadStatusValue | typeof ALL_VALUE; label: string }[] = [
  { value: ALL_VALUE, label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];
const VALID: LeadStatusValue[] = ["new", "contacted", "converted", "closed"];

function parseStatusParam(raw: string | null): LeadStatusValue | undefined {
  if (!raw) return undefined;
  return VALID.includes(raw as LeadStatusValue)
    ? (raw as LeadStatusValue)
    : undefined;
}

export function EventLeadsFilters({ resultCount }: EventLeadsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = parseStatusParam(searchParams.get("status"));
  const selectValue = current ?? ALL_VALUE;

  function pushParams(next: URLSearchParams): void {
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/admin/event-leads?${qs}` : "/admin/event-leads");
    });
  }

  function setStatus(value: string): void {
    const next = new URLSearchParams(searchParams);
    if (value === ALL_VALUE) {
      next.delete("status");
    } else {
      next.set("status", value);
    }
    pushParams(next);
  }

  const hasFilter = Boolean(current);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="min-w-[200px] flex-1 space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
          Status
        </label>
        <Select
          value={selectValue}
          onValueChange={setStatus}
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">
          {resultCount} lead{resultCount === 1 ? "" : "s"}
        </span>
        {hasFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => pushParams(new URLSearchParams())}
            disabled={pending}
          >
            <X className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
