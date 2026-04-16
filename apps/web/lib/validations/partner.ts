import { z } from "zod";

import { AREA_NAMES } from "@/lib/constants/areas";

export const PARTNER_AREA_OPTIONS = [...AREA_NAMES, "Other"] as const;

export type PartnerAreaOption = (typeof PARTNER_AREA_OPTIONS)[number];

const partnerAreaEnumTuple = PARTNER_AREA_OPTIONS as unknown as [
  PartnerAreaOption,
  ...PartnerAreaOption[],
];

export const partnerFormSchema = z.object({
  owner_name: z.string().trim().min(2).max(100),
  cafe_name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9\s-]{10,15}$/),
  area: z.enum(partnerAreaEnumTuple),
  description: z.string().trim().max(500).optional(),
  instagram_handle: z.string().trim().max(50).optional(),
  honeypot: z.preprocess(
    (v) => (v == null ? "" : String(v)),
    z.string().max(0),
  ),
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;
