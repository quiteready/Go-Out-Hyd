import { z } from "zod";

import { VALID_EVENT_TYPES } from "@/lib/constants/events";

const eventTypeTuple = VALID_EVENT_TYPES as unknown as [
  (typeof VALID_EVENT_TYPES)[number],
  ...(typeof VALID_EVENT_TYPES)[number][],
];

export const eventSubmissionSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
    eventType: z.enum(eventTypeTuple, { message: "Please select an event type" }),
    // datetime-local input returns "YYYY-MM-DDTHH:mm" — coerce to Date
    startTime: z.coerce.date({ message: "Please enter a valid date and time" }),
    organizerName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    organizerPhone: z
      .string()
      .trim()
      .regex(/^[+]?[0-9\s-]{10,15}$/, "Please enter a valid phone number"),
    organizerInstagram: z.string().trim().max(60).optional(),
    venueName: z.string().trim().max(150).optional(),
    venueTba: z.preprocess(
      // Checkbox inputs send "on" when checked; absent when unchecked
      (v) => v === "on" || v === true,
      z.boolean(),
    ),
    description: z.string().trim().max(1000).optional(),
    // Ticket price in rupees — omit or leave empty for free events
    ticketPrice: z.preprocess(
      (v) => (v === "" || v == null ? undefined : Number(v)),
      z.number().int().min(1).max(100000).optional(),
    ),
    coverImage: z
      .string()
      .trim()
      .url("Please enter a valid image URL")
      .max(500)
      .optional()
      .or(z.literal("")),
    honeypot: z.preprocess(
      (v) => (v == null ? "" : String(v)),
      z.string().max(0),
    ),
  })
  .refine(
    // Venue name required unless TBA is checked
    (data) => data.venueTba || (data.venueName && data.venueName.length > 0),
    {
      message: "Please enter a venue name, or check 'Venue TBA'",
      path: ["venueName"],
    },
  );

export type EventSubmissionValues = z.infer<typeof eventSubmissionSchema>;
