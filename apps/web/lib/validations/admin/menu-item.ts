import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const menuItemSchema = z.object({
  category: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(160),
  price: z
    .number({ message: "Price must be a number" })
    .int("Price must be a whole number")
    .min(0, "Price cannot be negative")
    .max(100000, "Price seems too high"),
  description: optionalText(500),
  isAvailable: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;
