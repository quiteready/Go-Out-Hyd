import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const cafeImageCreateSchema = z.object({
  imageUrl: z.string().trim().url("Image URL is required").max(1000),
  altText: optionalText(200),
});

export const cafeImageUpdateSchema = z.object({
  altText: optionalText(200),
});

export type CafeImageCreateValues = z.infer<typeof cafeImageCreateSchema>;
export type CafeImageUpdateValues = z.infer<typeof cafeImageUpdateSchema>;
