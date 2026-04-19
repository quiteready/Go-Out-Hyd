import { z } from "zod";
import { VALID_EVENT_TYPES } from "@/lib/constants/events";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
    z.string().trim().max(max).optional(),
  );

const optionalNullableText = (max: number) =>
  z.preprocess(
    (v) =>
      v === null || (typeof v === "string" && v.trim().length === 0)
        ? undefined
        : v,
    z.string().trim().max(max).optional(),
  );

const optionalUuid = z.preprocess(
  (v) =>
    v === null || (typeof v === "string" && v.trim().length === 0)
      ? undefined
      : v,
  z.string().uuid().optional(),
);

const optionalIsoDateTime = z.preprocess(
  (v) =>
    v === null || (typeof v === "string" && v.trim().length === 0)
      ? undefined
      : v,
  z.string().datetime({ offset: true }).optional(),
);

const optionalPositiveInt = z.preprocess(
  (v) => {
    if (v === null || v === undefined || v === "") return undefined;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  },
  z.number().int().min(0).max(1_000_000).optional(),
);

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens"),
    description: optionalText(5000),
    eventType: z.enum(VALID_EVENT_TYPES),
    cafeId: optionalUuid,
    venueName: optionalNullableText(200),
    venueAddress: optionalNullableText(500),
    venueMapsUrl: optionalNullableText(500),
    startTime: z.string().datetime({ offset: true }),
    endTime: optionalIsoDateTime,
    ticketPrice: optionalPositiveInt,
    earlyBirdPrice: optionalPositiveInt,
    earlyBirdEndsAt: optionalIsoDateTime,
    maxTickets: optionalPositiveInt,
    coverImage: optionalText(1000),
    status: z.enum(["upcoming", "cancelled", "completed"]),
    organizerDisplayName: optionalNullableText(200),
    organizerPhone: optionalNullableText(80),
    organizerInstagramHandle: optionalNullableText(500),
  })
  .superRefine((data, ctx) => {
    // Either a cafe OR a custom venue must be provided.
    if (!data.cafeId && !data.venueName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["venueName"],
        message: "Either select a cafe or provide a custom venue name.",
      });
    }

    // End time must be after start time.
    if (data.endTime) {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "End time must be after start time.",
        });
      }
    }

    // Early-bird price + ends-at must be set together.
    const hasEbPrice = data.earlyBirdPrice !== undefined;
    const hasEbEndsAt = data.earlyBirdEndsAt !== undefined;
    if (hasEbPrice !== hasEbEndsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasEbPrice ? ["earlyBirdEndsAt"] : ["earlyBirdPrice"],
        message: "Early-bird price and end time must be set together.",
      });
    }

    // Early-bird must be cheaper than regular ticket price (if both present).
    if (
      data.earlyBirdPrice !== undefined &&
      data.ticketPrice !== undefined &&
      data.earlyBirdPrice >= data.ticketPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["earlyBirdPrice"],
        message: "Early-bird price must be lower than the regular price.",
      });
    }

    // Early-bird ends-at must be before start time.
    if (data.earlyBirdEndsAt) {
      const start = new Date(data.startTime).getTime();
      const ebEnd = new Date(data.earlyBirdEndsAt).getTime();
      if (ebEnd >= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["earlyBirdEndsAt"],
          message: "Early-bird must end before the event start time.",
        });
      }
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
