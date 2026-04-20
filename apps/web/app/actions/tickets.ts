"use server";

import crypto from "crypto";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/drizzle/db";
import { tickets, events } from "@/lib/drizzle/schema";
import { sendTicketEmail } from "@/lib/email";
import { env } from "@/lib/env";
import {
  computeTicketCheckoutRupees,
  totalRupeesToPaise,
} from "@/lib/events/ticket-checkout-pricing";
import { getPayablePricePerTicketRupees } from "@/lib/events/ticket-pricing";
import { countSoldTickets, getTicketByCode } from "@/lib/queries/tickets";
import { getRazorpayClient } from "@/lib/razorpay";

// ─── Input schemas ────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  eventId: z.string().uuid(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(15),
  quantity: z.number().int().min(1).max(10),
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

// ─── Result types ─────────────────────────────────────────────────────────────

export type CreateOrderResult =
  | {
      success: true;
      orderId: string;
      ticketCode: string;
      amountPaise: number;
      keyId: string;
      ticketSubtotalRupees: number;
      convenienceFeeRupees: number;
      totalRupees: number;
    }
  | { success: false; error: string };

export type VerifyPaymentResult =
  | { success: true; ticketCode: string }
  | { success: false; error: string };

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createOrder(
  input: z.infer<typeof createOrderSchema>,
): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    return { success: false, error: "Payment service is not configured." };
  }

  const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    return { success: false, error: "Payment service is not configured." };
  }

  const { eventId, customerName, customerEmail, customerPhone, quantity } = parsed.data;

  // Fetch and validate event
  const eventRows = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  const event = eventRows[0];
  if (!event) {
    return { success: false, error: "Event not found." };
  }
  if (event.status !== "upcoming") {
    return { success: false, error: "This event is no longer available." };
  }
  if (!event.ticketPrice || event.ticketPrice <= 0) {
    return { success: false, error: "This event does not require a ticket." };
  }

  const unitRupees = getPayablePricePerTicketRupees(event);
  if (unitRupees === null || unitRupees <= 0) {
    return { success: false, error: "This event does not require a ticket." };
  }

  // Capacity check
  if (event.maxTickets !== null) {
    const sold = await countSoldTickets(eventId);
    if (sold + quantity > event.maxTickets) {
      const remaining = event.maxTickets - sold;
      if (remaining <= 0) {
        return { success: false, error: "Sorry, this event is sold out." };
      }
      return {
        success: false,
        error: `Only ${remaining} ticket${remaining === 1 ? "" : "s"} remaining.`,
      };
    }
  }

  const { ticketSubtotalRupees, convenienceFeeRupees, totalRupees } =
    computeTicketCheckoutRupees(quantity, unitRupees);
  const amountPaise = totalRupeesToPaise(totalRupees);
  const ticketCode = crypto.randomUUID();

  // Create Razorpay order
  let razorpayOrder: { id: string };
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: ticketCode.slice(0, 40),
    });
  } catch {
    return { success: false, error: "Could not create payment order. Please try again." };
  }

  // Insert pending ticket row
  try {
    await db.insert(tickets).values({
      eventId,
      customerName,
      customerEmail,
      customerPhone,
      quantity,
      amountPaid: totalRupees,
      razorpayOrderId: razorpayOrder.id,
      ticketCode,
      status: "pending",
    });
  } catch {
    return { success: false, error: "Could not save booking. Please try again." };
  }

  return {
    success: true,
    orderId: razorpayOrder.id,
    ticketCode,
    amountPaise,
    keyId,
    ticketSubtotalRupees,
    convenienceFeeRupees,
    totalRupees,
  };
}

export async function verifyPayment(
  input: z.infer<typeof verifyPaymentSchema>,
): Promise<VerifyPaymentResult> {
  const parsed = verifyPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid payment data." };
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return { success: false, error: "Payment service is not configured." };
  }

  // Verify HMAC-SHA256 signature
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return { success: false, error: "Payment verification failed. Please contact support." };
  }

  // Update ticket to paid
  const updated = await db
    .update(tickets)
    .set({
      status: "paid",
      razorpayPaymentId,
      razorpaySignature,
    })
    .where(eq(tickets.razorpayOrderId, razorpayOrderId))
    .returning({ ticketCode: tickets.ticketCode });

  const ticketCode = updated[0]?.ticketCode;
  if (!ticketCode) {
    return { success: false, error: "Could not update ticket status." };
  }

  // Send ticket email — failure must not block the success response
  try {
    const ticketWithEvent = await getTicketByCode(ticketCode);
    if (ticketWithEvent) {
      await sendTicketEmail(ticketWithEvent);
    }
  } catch (err) {
    console.error("[verifyPayment] Ticket email failed:", err);
  }

  return { success: true, ticketCode };
}
