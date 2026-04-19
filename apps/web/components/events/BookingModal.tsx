"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createOrder, verifyPayment } from "@/app/actions/tickets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { EventForBooking } from "@/components/events/BookButton";

interface BookingModalProps {
  event: EventForBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatPhoneForRazorpay(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return trimmed;
}

export function BookingModal({ event, open, onOpenChange }: BookingModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantityText, setQuantityText] = useState("1");
  const [isLoading, setIsLoading] = useState(false);

  const parsedQuantity = parseInt(quantityText, 10);
  const quantity =
    Number.isFinite(parsedQuantity) && parsedQuantity >= 1
      ? Math.min(10, parsedQuantity)
      : 1;
  const total = event.payablePrice * quantity;

  function resetForm(): void {
    setName("");
    setEmail("");
    setPhone("");
    setQuantityText("1");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (isLoading) return;

    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        toast.error("Payment unavailable. Please try again.");
        setIsLoading(false);
        return;
      }

      const orderResult = await createOrder({
        eventId: event.id,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        quantity,
      });

      if (!orderResult.success) {
        toast.error(orderResult.error);
        setIsLoading(false);
        return;
      }

      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        toast.error("Payment unavailable. Please try again.");
        setIsLoading(false);
        return;
      }

      const options: RazorpayOptions = {
        key: orderResult.keyId,
        amount: orderResult.amountPaise,
        currency: "INR",
        name: "GoOut Hyd",
        description: event.title,
        order_id: orderResult.orderId,
        handler: async (response) => {
          const verifyResult = await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyResult.success) {
            resetForm();
            onOpenChange(false);
            router.push(`/booking-confirmation?code=${verifyResult.ticketCode}`);
          } else {
            toast.error(verifyResult.error);
            setIsLoading(false);
          }
        },
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: formatPhoneForRazorpay(phone),
        },
        theme: { color: "#C4813A" },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", (errResponse: unknown) => {
        console.error("Razorpay payment failed:", errResponse);
        toast.error("Payment failed. Please try again.");
        setIsLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-espresso">
            Book your ticket
          </DialogTitle>
          <DialogDescription>
            {event.title}
            {event.listPrice !== undefined &&
              event.listPrice > event.payablePrice && (
                <span className="mt-2 block text-xs text-roast/80">
                  Early bird: ₹{event.payablePrice} per ticket (regular ₹
                  {event.listPrice})
                </span>
              )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-name">Full name</Label>
            <Input
              id="booking-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
              maxLength={100}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-email">Email</Label>
            <Input
              id="booking-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-phone">Phone</Label>
            <Input
              id="booking-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              disabled={isLoading}
              required
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-qty">Number of tickets</Label>
            <Input
              id="booking-qty"
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              value={quantityText}
              onChange={(e) => setQuantityText(e.target.value)}
              onBlur={() => setQuantityText(String(quantity))}
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-md bg-milk px-4 py-3">
            <span className="text-sm text-roast">Total</span>
            <span className="font-heading text-xl text-espresso">₹{total}</span>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-caramel text-foam hover:bg-caramel/90"
            >
              {isLoading ? "Processing…" : `Pay ₹${total}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
