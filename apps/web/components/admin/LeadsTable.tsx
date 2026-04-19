"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateLeadNotes, updateLeadStatus } from "@/app/actions/admin/leads";
import type { AdminLeadRow } from "@/lib/queries/admin/leads";
import type { LeadStatusValue } from "@/lib/validations/admin/lead";

interface LeadsTableProps {
  leads: AdminLeadRow[];
  emptyMessage?: string;
}

const STATUS_OPTIONS: { value: LeadStatusValue; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];

const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function LeadNotesCell({ lead }: { lead: AdminLeadRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(lead.notes ?? "");

  useEffect(() => {
    setValue(lead.notes ?? "");
  }, [lead.notes]);

  function handleBlur(): void {
    const trimmed = value.trim();
    const server = (lead.notes ?? "").trim();
    if (trimmed === server) return;

    startTransition(async () => {
      const result = await updateLeadNotes(lead.id, value);
      if (!result.success) {
        toast.error(result.error);
        setValue(lead.notes ?? "");
        return;
      }
      toast.success("Notes saved");
      router.refresh();
    });
  }

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      rows={2}
      maxLength={2000}
      disabled={pending}
      placeholder="Internal notes…"
      className="min-h-[60px] resize-y text-sm"
    />
  );
}

function LeadStatusCell({ lead }: { lead: AdminLeadRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(next: LeadStatusValue): void {
    if (next === lead.status) return;
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Status updated");
      router.refresh();
    });
  }

  return (
    <Select
      value={lead.status}
      onValueChange={(v) => handleChange(v as LeadStatusValue)}
      disabled={pending}
    >
      <SelectTrigger className="w-[140px]">
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
  );
}

export function LeadsTable({
  leads,
  emptyMessage = "No partner leads match the current filter.",
}: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white">
        <p className="p-10 text-center text-sm text-neutral-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitted (IST)</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Cafe</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="min-w-[220px]">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="whitespace-nowrap text-neutral-700">
                {IST_FORMATTER.format(lead.createdAt)}
              </TableCell>
              <TableCell className="font-medium text-neutral-900">
                {lead.ownerName}
              </TableCell>
              <TableCell className="text-neutral-800">{lead.cafeName}</TableCell>
              <TableCell className="text-neutral-700">{lead.phone}</TableCell>
              <TableCell className="text-neutral-700">{lead.area}</TableCell>
              <TableCell>
                <LeadStatusCell lead={lead} />
              </TableCell>
              <TableCell>
                <LeadNotesCell lead={lead} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
