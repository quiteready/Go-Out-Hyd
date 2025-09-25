import { stripe, STRIPE_CONFIG } from "./stripe";
import type Stripe from "stripe";
import type { SubscriptionTier } from "./subscriptions";

export interface StripeSubscriptionData {
  tier: SubscriptionTier;
  status: Stripe.Subscription.Status | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  downgradeScheduled: boolean;
}

/**
 * Get subscription data directly from Stripe using customer ID
 * Throws error on API failures - should be caught and handled with toast notifications
 */
export async function getSubscriptionFromStripe(
  customerId: string,
): Promise<StripeSubscriptionData> {
  try {
    // Query Stripe directly using customer ID
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    const activeSubscription = subscriptions.data.find(
      (sub) => sub.status === "active" || sub.status === "past_due",
    );

    if (!activeSubscription) {
      return {
        tier: "free",
        status: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        downgradeScheduled: false,
      };
    }

    // Determine tier from price ID
    const priceId = activeSubscription.items.data[0]?.price.id;
    let tier: SubscriptionTier = "free";

    if (priceId === STRIPE_CONFIG.BASIC_PRICE_ID) {
      tier = "basic";
    } else if (priceId === STRIPE_CONFIG.PRO_PRICE_ID) {
      tier = "pro";
    }

    // Get period data from subscription items (where Stripe actually stores it)
    const firstItem = activeSubscription.items.data[0];
    const periodStart = firstItem?.current_period_start;
    const periodEnd = firstItem?.current_period_end;

    // Verify we have the required period data
    if (!periodEnd && tier !== "free") {
      console.error(
        "❌ [Stripe Error] Missing current_period_end in subscription item:",
        {
          subscriptionId: activeSubscription.id,
          customerId,
          tier,
          hasItems: activeSubscription.items.data.length > 0,
          firstItemHasPeriodEnd: !!firstItem?.current_period_end,
        },
      );
      throw new Error(
        `Missing period data in Stripe subscription items for subscription ${activeSubscription.id}`,
      );
    }

    // Check for subscription schedules (managed by Customer Portal)
    // Check for Pro to Basic (paid to paid) downgrades
    let downgradeScheduled = false;

    try {
      const schedules = await stripe.subscriptionSchedules.list({
        customer: customerId,
        limit: 10,
      });

      // Look for active or not_started schedules that indicate downgrades
      const activeSchedules = schedules.data.filter(
        (schedule) =>
          schedule.status === "active" || schedule.status === "not_started",
      );

      for (const schedule of activeSchedules) {
        // Check if any phase in the schedule contains a downgrade to Basic
        for (const phase of schedule.phases) {
          const phaseHasBasicPrice = phase.items?.some(
            (item) => item.price === STRIPE_CONFIG.BASIC_PRICE_ID,
          );

          // Downgrade to Basic: Current tier is Pro and schedule has Basic price
          if (tier === "pro" && phaseHasBasicPrice) {
            downgradeScheduled = true;
            break; // Found what we need, exit early
          }
        }
        if (downgradeScheduled) break; // Exit outer loop too
      }
    } catch (error) {
      console.error("Error checking subscription schedules:", error);
      // Don't fail the whole request if schedule check fails
    }

    return {
      tier,
      status: activeSubscription.status ?? null,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: Boolean(activeSubscription.cancel_at_period_end),
      downgradeScheduled,
    };
  } catch (error) {
    console.error("Error fetching subscription from Stripe:", error);
    throw new Error(
      `Failed to fetch subscription data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
