"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { db } from "@/lib/drizzle/db";
import { users } from "@/lib/drizzle/schema";
import { env } from "@/lib/env";
import { requireUserId, getCurrentUserId } from "@/lib/auth";

/**
 * Extended Stripe billing portal session creation parameters
 * to support subscription flows with after_completion
 */
interface ExtendedBillingPortalParams {
  customer: string;
  return_url: string;
  flow_data?: {
    type: "subscription_update" | "subscription_cancel";
    subscription_update?: {
      subscription: string;
    };
    subscription_cancel?: {
      subscription: string;
    };
    after_completion?: {
      type: "redirect";
      redirect: {
        return_url: string;
      };
    };
  };
}

/**
 * Create customer portal session for subscription update with deep link
 */
async function getSubscriptionUpdateURL(
  customerId: string,
  newPriceId: string,
  activeSubscription: Stripe.Subscription,
): Promise<{ success: true; url: string }> {
  try {
    // 1. Check if they're already on the target plan
    const currentPriceId = activeSubscription.items.data[0]?.price.id;
    if (currentPriceId === newPriceId) {
      // Already on this plan, redirect to profile
      return {
        success: true,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?message=already_subscribed`,
      };
    }

    // 2. Create customer portal session with subscription update flow
    const sessionParams: ExtendedBillingPortalParams = {
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile`, // Cancel/back URL (no message)
      flow_data: {
        type: "subscription_update",
        subscription_update: {
          subscription: activeSubscription.id,
        },
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?message=upgraded`, // Success-only URL
          },
        },
      },
    };

    const session = await stripe.billingPortal.sessions.create(
      sessionParams as Stripe.BillingPortal.SessionCreateParams,
    );

    return {
      success: true,
      url: session.url,
    };
  } catch (error) {
    console.error("Error creating subscription update portal session:", error);
    // If portal session fails, redirect to profile with error
    return {
      success: true,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?message=portal_error`,
    };
  }
}

/**
 * Create customer portal session for subscription cancellation with deep link
 */
async function getSubscriptionCancelURL(
  customerId: string,
  activeSubscription: Stripe.Subscription,
): Promise<{ success: true; url: string }> {
  try {
    // Create customer portal session with subscription cancel flow
    const sessionParams: ExtendedBillingPortalParams = {
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile`, // Cancel/back URL
      flow_data: {
        type: "subscription_cancel",
        subscription_cancel: {
          subscription: activeSubscription.id,
        },
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?message=cancelled`, // Success-only URL
          },
        },
      },
    };

    const session = await stripe.billingPortal.sessions.create(
      sessionParams as Stripe.BillingPortal.SessionCreateParams,
    );

    return {
      success: true,
      url: session.url,
    };
  } catch (error) {
    console.error("Error creating subscription cancel portal session:", error);
    // If portal session fails, redirect to profile with error
    return {
      success: true,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?message=portal_error`,
    };
  }
}

// Create Stripe checkout session for subscription
export async function createCheckoutSession(priceId: string): Promise<void> {
  try {
    const userId = await requireUserId();

    // Get or create user in our database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!dbUser) {
      throw new Error("User not found");
    }

    let customerId = dbUser.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.full_name || undefined,
        metadata: {
          user_id: userId,
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripe_customer_id: customerId })
        .where(eq(users.id, userId));
    }

    // Check if user has existing subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      // User has existing subscription, use portal deep link for update
      const portalResult = await getSubscriptionUpdateURL(
        customerId,
        priceId,
        subscriptions.data[0],
      );
      redirect(portalResult.url);
    }

    // No existing subscription, proceed with checkout for new subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }${STRIPE_CONFIG.SUCCESS_URL}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }${STRIPE_CONFIG.CANCEL_URL}`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_update: {
        address: "auto",
        name: "auto",
      },
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }

    redirect(session.url);
  } catch (error) {
    // Check if this is a Next.js redirect (which is expected behavior)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      // Re-throw redirect errors so they work properly
      throw error;
    }

    console.error("Error creating checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
}

// Create customer portal session for billing management
export async function createCustomerPortalSession(): Promise<{
  success: boolean;
  portalUrl?: string;
  fallbackUrl?: string;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!dbUser?.stripe_customer_id) {
      return { success: false, error: "No Stripe customer found" };
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripe_customer_id,
        return_url: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/profile`,
      });

      // Return the portal URL for client-side redirect
      return {
        success: true,
        portalUrl: session.url,
      };
    } catch (stripeError: unknown) {
      console.error("Stripe customer portal error:", stripeError);

      // Check if customer portal is not configured
      const isStripeError = (
        err: unknown,
      ): err is { code?: string; message?: string } => {
        return typeof err === "object" && err !== null;
      };

      if (
        isStripeError(stripeError) &&
        (stripeError.code === "customer_portal_not_enabled" ||
          stripeError.message?.includes("customer portal") ||
          stripeError.message?.includes("not enabled"))
      ) {
        // If we have a fallback URL configured, return it
        if (env.STRIPE_CUSTOMER_PORTAL_URL) {
          return {
            success: false,
            fallbackUrl: env.STRIPE_CUSTOMER_PORTAL_URL,
            error: "Customer portal not configured - using fallback",
          };
        }

        return {
          success: false,
          error:
            "Customer portal not configured. Please enable it in your Stripe Dashboard under Settings → Billing → Customer Portal.",
        };
      }

      // Other Stripe errors
      return {
        success: false,
        error: "Failed to create customer portal session",
      };
    }
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return {
      success: false,
      error: "Failed to create customer portal session",
    };
  }
}

/**
 * Create checkout session for specified plan
 */
export async function createPlanCheckoutSession(
  plan: "basic" | "pro",
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const priceId =
      plan === "basic"
        ? STRIPE_CONFIG.BASIC_PRICE_ID
        : STRIPE_CONFIG.PRO_PRICE_ID;

    await createCheckoutSession(priceId);
    return {
      success: true,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error(`Error creating ${plan} checkout session:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session",
    };
  }
}

/**
 * Create portal session for subscription cancellation
 */
export async function createCancelSession(): Promise<void> {
  try {
    const userId = await requireUserId();

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!dbUser?.stripe_customer_id) {
      throw new Error("No Stripe customer found");
    }

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: dbUser.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    const portalResult = await getSubscriptionCancelURL(
      dbUser.stripe_customer_id,
      subscriptions.data[0],
    );

    redirect(portalResult.url);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Error creating cancel portal session:", error);
    throw new Error("Failed to create cancel portal session");
  }
}
