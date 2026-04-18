# Razorpay Integration Reference — GoOut Hyd

> Condensed from the official 3208-line Razorpay Web Standard Checkout doc.  
> Covers **only** what this project uses: Node.js server-side order creation, standard checkout popup, signature verification.  
> Everything else (PHP, Java, Ruby, subscriptions, partial payments, international currencies, Android/iOS SDKs) is omitted.

---

## Overview — The 5-Step Flow

```
1. Server creates Razorpay Order → returns order_id
2. Frontend loads checkout script + opens popup with order_id
3. Customer pays (card / UPI / netbanking / wallet)
4. Razorpay returns { razorpay_payment_id, razorpay_order_id, razorpay_signature } to handler
5. Server verifies signature → confirms payment is authentic
```

**Critical rule**: Payments made without an `order_id` cannot be captured and are auto-refunded. Always create an order first.

---

## Environment Variables

```bash
# Server-only (never expose to frontend)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Public — safe for frontend
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

Switch to `rzp_live_...` keys when going live. Same variable names, different values.

---

## Step 1 — Create Order (Server-Side)

**Always done on the server. Never from the client.**

```typescript
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const order = await razorpay.orders.create({
  amount: 50000,       // in paise — ₹500 = 50000 paise
  currency: 'INR',
  receipt: 'receipt_id_here',  // your internal reference, max 40 chars
})
// order.id = "order_XXXXXXXXXXXXXXXX"
```

**Amount rule**: Store prices in whole rupees (₹500). Multiply by 100 only when calling Razorpay (`amount * 100`). Never store paise in your DB.

### Order Response
```json
{
  "id": "order_IluGWxBm9U8zJ8",
  "entity": "order",
  "amount": 50000,
  "amount_paid": 0,
  "currency": "INR",
  "status": "created",
  "receipt": "receipt_id"
}
```

### Order States
| Stage | Order Status | Payment Status | Meaning |
|---|---|---|---|
| I | `created` | `created` | Order exists, no payment attempted |
| II | `attempted` | `authorized` / `failed` | Payment attempted, waiting for capture |
| III | `paid` | `captured` | Payment complete — no more payments allowed |

---

## Step 2 — Checkout on Client (Frontend)

Load the Razorpay script dynamically (do not add to `<head>` — it must load fresh per checkout session):

```typescript
// Load script helper
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as any).Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
```

### Checkout Options

```typescript
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,   // public key only
  amount: amountInPaise,                            // order.amount (already in paise from server)
  currency: 'INR',
  name: 'GoOut Hyd',
  description: eventTitle,
  order_id: orderId,                                // from server Step 1
  
  // Called on successful payment
  handler: async function(response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) {
    // Send to server for verification (Step 3)
    const result = await verifyPayment({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    })
    if (result.success) {
      router.push(`/booking-confirmation?code=${result.ticket_code}`)
    }
  },

  prefill: {
    name: customerName,
    email: customerEmail,
    contact: customerPhone,   // format: +91XXXXXXXXXX
  },

  theme: {
    color: '#C4813A',         // caramel
  },

  modal: {
    ondismiss: function() {
      // User closed checkout without paying
      setIsLoading(false)
    },
  },
}

const rzp = new (window as any).Razorpay(options)

// Handle payment failure (user sees retry UI inside the popup automatically)
rzp.on('payment.failed', function(response: any) {
  console.error('Payment failed:', response.error)
  // Optional: show toast with response.error.description
})

rzp.open()
```

**Key parameters:**
| Parameter | Required | Notes |
|---|---|---|
| `key` | Yes | Public key ID only |
| `amount` | Yes | Paise (rupees × 100) |
| `currency` | Yes | `'INR'` |
| `name` | Yes | Business name on checkout form |
| `order_id` | Yes | From server — ties payment to order |
| `handler` | Yes (or `callback_url`) | Called on success |
| `prefill.contact` | Recommended | Format: `+91XXXXXXXXXX` — improves conversion |
| `theme.color` | Optional | HEX brand colour |

---

## Step 3 — Verify Signature (Server-Side)

**Mandatory.** Never mark a payment as successful without verifying the signature.

```typescript
import crypto from 'crypto'

function verifyRazorpaySignature(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
): boolean {
  const body = razorpay_order_id + '|' + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  return expectedSignature === razorpay_signature
}
```

**Algorithm**: `HMAC-SHA256(order_id + "|" + payment_id, key_secret)`

If signature does not match → return error, do NOT save paid status.

---

## Payment Capture Settings (Dashboard)

By default, payments are `authorized` but not automatically `captured`. Enable auto-capture in the Razorpay Dashboard:

**Dashboard → Account & Settings → Payment Capture → Auto**

With auto-capture on, every authorized payment is immediately captured (settled). Uncaptured payments are auto-refunded after a set time.

---

## Testing

### Test Cards (Domestic)
| Network | Card Number | CVV & Expiry |
|---|---|---|
| Visa | `4100 2800 0000 1007` | Any CVV, any future date |
| Mastercard | `5500 6700 0000 1002` | Any CVV, any future date |
| RuPay | `6527 6589 0000 1005` | Any CVV, any future date |

### Test UPI
- `success@razorpay` — payment succeeds
- `failure@razorpay` — payment fails

### Test Netbanking / Wallet
Select any bank/wallet → redirects to mock page with **Success** / **Failure** buttons.

> No real money is deducted in test mode.

---

## Going Live Checklist

1. **Enable auto-capture** in Dashboard → Account & Settings → Payment Capture
2. **Switch to Live keys**: `rzp_live_...` — update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` in Vercel environment variables
3. **Complete KYC** on Razorpay Dashboard (required for live payments)
4. **Domain approval**: your domain must be allowlisted in Razorpay (already submitted, under review)
5. **Test with ₹1**: Do one real payment before going fully live
6. **(Optional) Webhooks**: Set up `order.paid` webhook for redundant payment confirmation — useful if user closes browser before `handler` fires

---

## Security Rules (Never Break)

- `RAZORPAY_KEY_SECRET` must **never** reach the browser — server only
- Always verify signature before marking ticket as `paid` or sending email
- Create one order per booking — do not reuse `order_id`
- Amount in DB = whole rupees (₹). Amount to Razorpay = paise (rupees × 100)
- If email send fails after payment → ticket is still saved as `paid`. Do not roll back.

---

## Relevant Files in This Project

| File | Purpose |
|---|---|
| `apps/web/lib/razorpay.ts` | Razorpay SDK client singleton |
| `apps/web/app/actions/tickets.ts` | `createOrder` + `verifyPayment` server actions |
| `apps/web/components/events/BookingModal.tsx` | Form + checkout popup (client component) |
| `apps/web/components/events/BookButton.tsx` | Trigger button (client component) |
| `apps/web/lib/drizzle/schema/tickets.ts` | Tickets table schema |
| `apps/web/lib/tickets.ts` | DB query functions for tickets |
| `apps/web/lib/email.ts` | `sendTicketEmail` function |
| `apps/web/app/(public)/booking-confirmation/page.tsx` | Post-payment confirmation page |
