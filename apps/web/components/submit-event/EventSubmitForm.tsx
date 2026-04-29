"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  submitEventForm,
  type SubmitEventFormResult,
} from "@/app/actions/submit-event";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { EVENT_TYPE_LABELS, VALID_EVENT_TYPES } from "@/lib/constants/events";
import { eventSubmissionSchema } from "@/lib/validations/event-submission";

function getStringFromFormData(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export function EventSubmitForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [eventType, setEventType] = useState<string>("");
  const [venueTba, setVenueTba] = useState<boolean>(false);
  const [state, formAction, isPending] = useActionState(
    submitEventForm,
    null as SubmitEventFormResult | null,
  );

  useEffect(() => {
    if (state === null) return;
    if (state.success) {
      toast.success(
        "Event submitted! We'll review it and confirm within 24 hours.",
      );
      formRef.current?.reset();
      setEventType("");
      setVenueTba(false);
      return;
    }
    toast.error(state.error);
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const fd = new FormData(e.currentTarget);
    const raw = {
      title: getStringFromFormData(fd, "title"),
      eventType: getStringFromFormData(fd, "eventType"),
      startTime: getStringFromFormData(fd, "startTime"),
      organizerName: getStringFromFormData(fd, "organizerName"),
      organizerPhone: getStringFromFormData(fd, "organizerPhone"),
      organizerInstagram:
        getStringFromFormData(fd, "organizerInstagram") || undefined,
      venueName: getStringFromFormData(fd, "venueName") || undefined,
      venueTba: fd.get("venueTba"),
      description: getStringFromFormData(fd, "description") || undefined,
      ticketPrice: getStringFromFormData(fd, "ticketPrice") || undefined,
      coverImage: getStringFromFormData(fd, "coverImage") || undefined,
      honeypot: "",
    };
    const parsed = eventSubmissionSchema.safeParse(raw);
    if (!parsed.success) {
      e.preventDefault();
      const msg =
        parsed.error.issues[0]?.message ?? "Please check your entries.";
      toast.error(msg);
    }
  }

  return (
    <Card className="border-brand-border bg-foam shadow-md">
      <CardHeader>
        <CardTitle className="font-heading text-2xl text-espresso">
          Submit Your Event
        </CardTitle>
        <CardDescription className="text-roast/80">
          Tell us about your event — we&apos;ll review it and list it within 24
          hours.
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
            <Label htmlFor="title">Event title</Label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              maxLength={120}
              placeholder="Jazz Night at Olive, Open Mic Wednesday…"
              className="border-input-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType">Event type</Label>
            {/* Hidden input carries the Select value into FormData */}
            <input type="hidden" name="eventType" value={eventType} readOnly />
            <Select value={eventType || undefined} onValueChange={setEventType}>
              <SelectTrigger
                id="eventType"
                className="w-full border-input-border"
                aria-label="Event type"
              >
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {VALID_EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {EVENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Date &amp; time</Label>
            <Input
              id="startTime"
              name="startTime"
              type="datetime-local"
              required
              className="border-input-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizerName">Your name</Label>
            <Input
              id="organizerName"
              name="organizerName"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              placeholder="Your name or organisation"
              className="border-input-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizerPhone">Phone number</Label>
            <Input
              id="organizerPhone"
              name="organizerPhone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              required
              className="border-input-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizerInstagram">
              Instagram handle{" "}
              <span className="font-normal text-roast/50">(optional)</span>
            </Label>
            <Input
              id="organizerInstagram"
              name="organizerInstagram"
              type="text"
              placeholder="@yourevent"
              maxLength={60}
              className="border-input-border"
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="venueTba"
              name="venueTba"
              checked={venueTba}
              onCheckedChange={(checked) => setVenueTba(checked === true)}
            />
            <Label htmlFor="venueTba" className="cursor-pointer font-normal">
              Venue to be announced closer to the date
            </Label>
          </div>

          {!venueTba && (
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue name</Label>
              <Input
                id="venueName"
                name="venueName"
                type="text"
                maxLength={150}
                placeholder="Lamakaan, Hard Rock Cafe, Studio 29…"
                className="border-input-border"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">
              About this event{" "}
              <span className="font-normal text-roast/50">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Line-up, format, what to expect, what to bring…"
              maxLength={1000}
              rows={4}
              className="resize-none border-input-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketPrice">
              Ticket price (₹){" "}
              <span className="font-normal text-roast/50">
                (leave blank for free events)
              </span>
            </Label>
            <Input
              id="ticketPrice"
              name="ticketPrice"
              type="number"
              min={1}
              max={100000}
              placeholder="e.g. 299"
              className="border-input-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">
              Cover image URL{" "}
              <span className="font-normal text-roast/50">(optional)</span>
            </Label>
            <Input
              id="coverImage"
              name="coverImage"
              type="url"
              placeholder="https://…"
              maxLength={500}
              className="border-input-border"
            />
          </div>

          {/* Hidden honeypot field — catches automated submissions */}
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
            className="w-full bg-caramel text-foam hover:bg-caramel/90"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Submitting…
              </>
            ) : (
              "Submit Event"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
