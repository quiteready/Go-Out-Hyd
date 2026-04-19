/**
 * Early-bird vs regular ticket price for public display and checkout.
 * Amounts are stored as whole rupees (same as Razorpay order creation).
 */

export type TicketPricedFields = {
  ticketPrice: number | null;
  earlyBirdPrice: number | null;
  earlyBirdEndsAt: Date | null;
};

/**
 * Per-ticket price the customer pays **right now** (early bird when active,
 * otherwise regular). Returns `null` when the event is free or not ticketed.
 */
export function getPayablePricePerTicketRupees(
  event: TicketPricedFields,
  now: Date = new Date(),
): number | null {
  if (event.ticketPrice === null || event.ticketPrice <= 0) {
    return null;
  }
  const eb = event.earlyBirdPrice;
  const ebEnd = event.earlyBirdEndsAt;
  if (
    eb !== null &&
    eb > 0 &&
    ebEnd !== null &&
    eb < event.ticketPrice &&
    now.getTime() <= ebEnd.getTime()
  ) {
    return eb;
  }
  return event.ticketPrice;
}

/** Regular list price when it differs from the payable early-bird price. */
export function getListPriceIfEarlyBirdActive(
  event: TicketPricedFields,
  now: Date = new Date(),
): number | null {
  const payable = getPayablePricePerTicketRupees(event, now);
  const list = event.ticketPrice;
  if (
    payable === null ||
    list === null ||
    payable >= list
  ) {
    return null;
  }
  return list;
}
