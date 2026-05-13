"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  submitEventLeadForm,
  type SubmitEventLeadFormResult,
} from "@/app/actions/event-leads";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { eventLeadFormSchema } from "@/lib/validations/event-lead";

function getStringFromFormData(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

const TICKETING_OPTIONS = [
  { value: "free", label: "Free event" },
  { value: "paid", label: "Paid tickets" },
  { value: "undecided", label: "Not decided yet" },
] as const;

export function EventLeadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [ticketingType, setTicketingType] = useState<string>("");
  const [state, formAction, isPending] = useActionState(
    submitEventLeadForm,
    null as SubmitEventLeadFormResult | null,
  );

  useEffect(() => {
    if (state === null) {
      return;
    }

    if (state.success) {
      toast.success("Thanks! We'll review your event request and call you soon.");
      formRef.current?.reset();
      setTicketingType("");
      return;
    }

    toast.error(state.error);
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const fd = new FormData(e.currentTarget);
    const raw = {
      contactName: getStringFromFormData(fd, "contactName"),
      contactPhone: getStringFromFormData(fd, "contactPhone"),
      contactInstagramHandle:
        getStringFromFormData(fd, "contactInstagramHandle") || undefined,
      eventTitle: getStringFromFormData(fd, "eventTitle"),
      eventType: getStringFromFormData(fd, "eventType") || undefined,
      expectedDateNote: getStringFromFormData(fd, "expectedDateNote") || undefined,
      venueName: getStringFromFormData(fd, "venueName") || undefined,
      area: getStringFromFormData(fd, "area") || undefined,
      ticketingType: getStringFromFormData(fd, "ticketingType"),
      expectedTicketPrice:
        getStringFromFormData(fd, "expectedTicketPrice") || undefined,
      details: getStringFromFormData(fd, "details") || undefined,
      honeypot: getStringFromFormData(fd, "honeypot"),
    };

    const parsed = eventLeadFormSchema.safeParse(raw);
    if (!parsed.success) {
      e.preventDefault();
      const message = parsed.error.issues[0]?.message ?? "Please check your entries.";
      toast.error(message);
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-medium text-foreground">
          Submit an event request
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Planning an event in Hyderabad? Share the basics and we&apos;ll get in touch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="contactName">Your name</Label>
            <Input id="contactName" name="contactName" required maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone number</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventTitle">What event do you want to host?</Label>
            <Input
              id="eventTitle"
              name="eventTitle"
              required
              maxLength={120}
              placeholder="Open mic night, stand-up show, indie gig..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketingType">Ticketing</Label>
            <input type="hidden" name="ticketingType" value={ticketingType} readOnly />
            <Select
              value={ticketingType || undefined}
              onValueChange={setTicketingType}
            >
              <SelectTrigger id="ticketingType" className="w-full">
                <SelectValue placeholder="Free, paid, or not decided yet" />
              </SelectTrigger>
              <SelectContent>
                {TICKETING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ticketingType === "paid" && (
            <div className="space-y-2">
              <Label htmlFor="expectedTicketPrice">Expected ticket price (INR)</Label>
              <Input
                id="expectedTicketPrice"
                name="expectedTicketPrice"
                type="number"
                min={1}
                max={100000}
                placeholder="e.g. 299"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expectedDateNote">
              Expected date{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="expectedDateNote"
              name="expectedDateNote"
              maxLength={120}
              placeholder="e.g. Last week of June, Friday evenings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueName">
              Venue / cafe name{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="venueName"
              name="venueName"
              maxLength={150}
              placeholder="Your cafe or proposed venue"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">
              Area{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="area" name="area" maxLength={100} placeholder="Madhapur, Jubilee Hills..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType">
              Event type{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="eventType"
              name="eventType"
              maxLength={80}
              placeholder="Open mic, workshop, comedy night..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInstagramHandle">
              Instagram handle{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="contactInstagramHandle"
              name="contactInstagramHandle"
              maxLength={60}
              placeholder="@yourhandle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">
              More details{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="details"
              name="details"
              rows={4}
              maxLength={1200}
              className="resize-none"
              placeholder="Audience size, vibe, requirements, performer lineup, etc."
            />
          </div>

          <input
            type="text"
            name="honeypot"
            className="sr-only"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-yellow text-black hover:opacity-85 hover:bg-yellow"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Sending...
              </>
            ) : (
              "Send event request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
