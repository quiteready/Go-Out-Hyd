import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const cafeFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens"),
  area: z.string().trim().min(2).max(80),
  description: optionalText(2000),
  coverImage: optionalText(1000),
  phone: optionalText(40),
  instagramHandle: optionalText(200),
  googleMapsUrl: optionalText(500),
  address: optionalText(500),
  openingHours: optionalText(200),
  status: z.enum(["active", "inactive"]),
});

export type CafeFormValues = z.infer<typeof cafeFormSchema>;
