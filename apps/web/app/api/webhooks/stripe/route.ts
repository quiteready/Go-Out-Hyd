import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Only handle subscription payment success events
    switch (event.type) {
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log(`✅ Successfully processed webhook event: ${event.type}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

// Handle successful payment - Used for email notification
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  console.log(`💰 Payment succeeded for customer: ${customerId}`);
  console.log(
    `💰 Invoice amount: ${invoice.amount_paid / 100} ${invoice.currency}`,
  );

  // Email notification for successful payment
  try {
    // In production, you would implement email sending here
    // Example implementations:
    // - Use Resend, SendGrid, or similar email service
    // - Send payment confirmation receipt to customer
    // - Notify internal team of subscription activation
    console.log(
      `📧 Payment success notification logged for customer: ${customerId}`,
    );
    console.log(
      `📧 Production setup: Implement email service integration here`,
    );
  } catch (emailError) {
    // Don't fail webhook processing if email fails
    console.error(
      `📧 Email notification failed for customer ${customerId}:`,
      emailError,
    );
  }
}
