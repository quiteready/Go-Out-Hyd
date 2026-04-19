import { z } from "zod";

const LEAD_STATUSES = ["new", "contacted", "converted", "closed"] as const;

export type LeadStatusValue = (typeof LEAD_STATUSES)[number];

export const leadStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LEAD_STATUSES),
});

export const leadNotesUpdateSchema = z.object({
  id: z.string().uuid(),
  notes: z.preprocess(
    (v) => {
      if (v === undefined || v === null) return null;
      if (typeof v !== "string") return v;
      const t = v.trim();
      return t === "" ? null : t;
    },
    z.union([z.string().max(2000), z.null()]),
  ),
});

export type LeadStatusUpdateInput = z.infer<typeof leadStatusUpdateSchema>;
export type LeadNotesUpdateInput = z.infer<typeof leadNotesUpdateSchema>;
