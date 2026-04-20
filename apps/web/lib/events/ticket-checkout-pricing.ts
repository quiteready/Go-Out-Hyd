/**
 * Checkout totals for paid events: ticket line amount plus platform convenience fee.
 * No GST line — amounts are whole rupees; Razorpay orders use paise (× 100) at the edge.
 */

/** Convenience fee as a fraction of ticket subtotal (3%). */
export const TICKET_CONVENIENCE_FEE_RATE = 0.03;

export type TicketCheckoutBreakdown = {
  ticketSubtotalRupees: number;
  convenienceFeeRupees: number;
  totalRupees: number;
};

/**
 * Computes ticket subtotal (qty × unit), rounded convenience fee on that subtotal,
 * and the final total. Used by checkout UI and createOrder so amounts stay aligned.
 */
export function computeTicketCheckoutRupees(
  quantity: number,
  unitPriceRupees: number,
): TicketCheckoutBreakdown {
  const q = Math.floor(quantity);
  const unit = Math.floor(unitPriceRupees);
  if (q < 1 || unit < 1) {
    return {
      ticketSubtotalRupees: 0,
      convenienceFeeRupees: 0,
      totalRupees: 0,
    };
  }

  const ticketSubtotalRupees = q * unit;
  const convenienceFeeRupees = Math.round(
    TICKET_CONVENIENCE_FEE_RATE * ticketSubtotalRupees,
  );
  const totalRupees = ticketSubtotalRupees + convenienceFeeRupees;

  return {
    ticketSubtotalRupees,
    convenienceFeeRupees,
    totalRupees,
  };
}

export function totalRupeesToPaise(totalRupees: number): number {
  return Math.round(totalRupees * 100);
}
