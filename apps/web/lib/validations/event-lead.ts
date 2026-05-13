import { z } from "zod";

export const EVENT_LEAD_TICKETING_OPTIONS = ["free", "paid", "undecided"] as const;

const ticketingTuple = EVENT_LEAD_TICKETING_OPTIONS as unknown as [
  (typeof EVENT_LEAD_TICKETING_OPTIONS)[number],
  ...(typeof EVENT_LEAD_TICKETING_OPTIONS)[number][],
];

export const eventLeadFormSchema = z
  .object({
    contactName: z.string().trim().min(2, "Please enter your name").max(100),
    contactPhone: z
      .string()
      .trim()
      .regex(/^[+]?[0-9\s-]{10,15}$/, "Please enter a valid phone number"),
    contactInstagramHandle: z.string().trim().max(60).optional(),
    eventTitle: z.string().trim().min(3, "Please enter the event title").max(120),
    eventType: z.string().trim().max(80).optional(),
    expectedDateNote: z.string().trim().max(120).optional(),
    venueName: z.string().trim().max(150).optional(),
    area: z.string().trim().max(100).optional(),
    ticketingType: z.enum(ticketingTuple, {
      message: "Please select free, paid, or undecided",
    }),
    expectedTicketPrice: z.preprocess(
      (v) => (v === "" || v == null ? undefined : Number(v)),
      z.number().int().min(1).max(100000).optional(),
    ),
    details: z.string().trim().max(1200).optional(),
    honeypot: z.preprocess(
      (v) => (v == null ? "" : String(v)),
      z.string().max(0),
    ),
  })
  .refine(
    (data) => data.ticketingType !== "paid" || data.expectedTicketPrice !== undefined,
    {
      message: "Add an expected ticket price for paid events",
      path: ["expectedTicketPrice"],
    },
  );

export type EventLeadFormValues = z.infer<typeof eventLeadFormSchema>;
