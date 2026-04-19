"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { DateTimePickerIST } from "@/components/admin/DateTimePickerIST";
import { slugify } from "@/lib/admin/slug";
import { EVENT_TYPE_LABELS, VALID_EVENT_TYPES } from "@/lib/constants/events";
import { createEvent, updateEvent } from "@/app/actions/admin/events";
import type { EventFormValues } from "@/lib/validations/admin/event";
import type { Event } from "@/lib/drizzle/schema";
import type { CafePickerOption } from "@/lib/queries/admin/events";

interface EventFormProps {
  /** When editing, pass the existing event; omit for create. */
  event?: Event;
  /** All cafes available for the cafe selector. */
  cafes: CafePickerOption[];
}

const STATUS_OPTIONS: { value: EventFormValues["status"]; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function buildInitialValues(event: Event | undefined): EventFormValues {
  return {
    title: event?.title ?? "",
    slug: event?.slug ?? "",
    description: event?.description ?? undefined,
    eventType: event?.eventType ?? "workshop",
    cafeId: event?.cafeId ?? undefined,
    venueName: event?.venueName ?? undefined,
    venueAddress: event?.venueAddress ?? undefined,
    venueMapsUrl: event?.venueMapsUrl ?? undefined,
    startTime: event?.startTime
      ? event.startTime.toISOString()
      : new Date().toISOString(),
    endTime: event?.endTime ? event.endTime.toISOString() : undefined,
    ticketPrice: event?.ticketPrice ?? undefined,
    earlyBirdPrice: event?.earlyBirdPrice ?? undefined,
    earlyBirdEndsAt: event?.earlyBirdEndsAt
      ? event.earlyBirdEndsAt.toISOString()
      : undefined,
    maxTickets: event?.maxTickets ?? undefined,
    coverImage: event?.coverImage ?? undefined,
    status: event?.status ?? "upcoming",
  };
}

export function EventForm({ event, cafes }: EventFormProps) {
  const router = useRouter();
  const isEdit = Boolean(event);
  const [pending, startTransition] = useTransition();

  const [values, setValues] = useState<EventFormValues>(() =>
    buildInitialValues(event),
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [useCustomVenue, setUseCustomVenue] = useState(
    Boolean(event && !event.cafeId),
  );

  function update<K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ): void {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(title: string): void {
    update("title", title);
    if (!slugManuallyEdited) {
      update("slug", slugify(title));
    }
  }

  function handleVenueModeToggle(custom: boolean): void {
    setUseCustomVenue(custom);
    if (custom) {
      update("cafeId", undefined);
    } else {
      update("venueName", undefined);
      update("venueAddress", undefined);
      update("venueMapsUrl", undefined);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    startTransition(async () => {
      const action =
        isEdit && event ? updateEvent(event.id, values) : createEvent(values);
      const result = await action;
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Event updated" : "Event created");
      if (isEdit) {
        router.refresh();
      } else {
        router.push(`/admin/events/${result.id}`);
      }
    });
  }

  const cafeOptions = cafes.filter((c) => c.status === "active");
  const inactiveSelected =
    values.cafeId &&
    !cafeOptions.some((c) => c.id === values.cafeId) &&
    cafes.some((c) => c.id === values.cafeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Basics">
        <Field label="Title" required>
          <Input
            value={values.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            disabled={pending}
          />
        </Field>

        <Field
          label="Slug"
          required
          hint="Used in the public URL: /events/[slug]. Lowercase letters, numbers, hyphens."
        >
          <Input
            value={values.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              update("slug", e.target.value);
            }}
            required
            disabled={pending}
          />
        </Field>

        <Field label="Event type" required>
          <Select
            value={values.eventType}
            onValueChange={(v) =>
              update("eventType", v as EventFormValues["eventType"])
            }
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALID_EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EVENT_TYPE_LABELS[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Status" required>
          <Select
            value={values.status}
            onValueChange={(v) =>
              update("status", v as EventFormValues["status"])
            }
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Description" hint="Shown on the public event page.">
          <Textarea
            value={values.description ?? ""}
            onChange={(e) => update("description", e.target.value || undefined)}
            rows={5}
            disabled={pending}
          />
        </Field>
      </Section>

      <Section title="Venue">
        <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Use a custom venue (no cafe)
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              For pop-ups, residential studios, or any venue not in the cafes
              table.
            </p>
          </div>
          <Switch
            checked={useCustomVenue}
            onCheckedChange={handleVenueModeToggle}
            disabled={pending}
            aria-label="Use a custom venue"
          />
        </div>

        {useCustomVenue ? (
          <>
            <Field label="Venue name" required>
              <Input
                value={values.venueName ?? ""}
                onChange={(e) =>
                  update("venueName", e.target.value || undefined)
                }
                required
                disabled={pending}
                placeholder="e.g. Srea Natural Studio"
              />
            </Field>
            <Field label="Venue address">
              <Textarea
                value={values.venueAddress ?? ""}
                onChange={(e) =>
                  update("venueAddress", e.target.value || undefined)
                }
                rows={2}
                disabled={pending}
                placeholder="Flat 206, Kadiris Apurupa Urban, Botanical Garden Road, Kondapur 500084"
              />
            </Field>
            <Field label="Google Maps URL">
              <Input
                value={values.venueMapsUrl ?? ""}
                onChange={(e) =>
                  update("venueMapsUrl", e.target.value || undefined)
                }
                placeholder="https://maps.app.goo.gl/…"
                disabled={pending}
              />
            </Field>
          </>
        ) : (
          <Field label="Cafe" required>
            <Select
              value={values.cafeId ?? ""}
              onValueChange={(v) => update("cafeId", v || undefined)}
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cafe" />
              </SelectTrigger>
              <SelectContent>
                {cafeOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-neutral-500">
                    No active cafes. Create one first or use a custom venue.
                  </div>
                ) : (
                  cafeOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{" "}
                      <span className="text-xs text-neutral-500">
                        — {c.area}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {inactiveSelected && (
              <p className="mt-1 text-xs text-amber-600">
                The currently linked cafe is inactive.
              </p>
            )}
          </Field>
        )}

        {useCustomVenue ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
            <p className="font-medium text-neutral-900">Phone & Instagram</p>
            <p className="mt-1 leading-relaxed">
              This form does not have separate phone or Instagram fields for a
              custom venue. Add a WhatsApp number, @handle, or links in the{" "}
              <strong>Description</strong> above so guests can reach you.
            </p>
          </div>
        ) : values.cafeId ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
            <p className="font-medium text-neutral-900">Phone & Instagram</p>
            <p className="mt-1 leading-relaxed">
              They are not edited here — they come from the linked café and show
              on the public event page.{" "}
              <Link
                href={`/admin/cafes/${values.cafeId}`}
                className="font-medium text-neutral-900 underline-offset-2 hover:underline"
              >
                Edit café phone & Instagram
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50/60 px-3 py-2 text-xs text-neutral-600">
            <p className="font-medium text-neutral-800">Phone & Instagram</p>
            <p className="mt-1 leading-relaxed">
              Choose a <strong>café</strong> above to reuse its phone and Instagram
              on the event page, or turn on <strong>custom venue</strong> and put
              contact details in the description.
            </p>
          </div>
        )}
      </Section>

      <Section title="When">
        <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          <p className="font-medium">One time range per event</p>
          <p className="mt-1 text-amber-900/90">
            This form does not support multiple slots in a single row. For
            example, an 11 AM–1 PM workshop and a 3 PM–5 PM workshop on the same
            day should be{" "}
            <strong>two separate events</strong> (same cafe, same description
            if you like, different title/slug/start/end). After saving the first,
            use <strong>New event</strong> again for the second slot.
          </p>
        </div>

        <Field label="Start time" required>
          <DateTimePickerIST
            value={values.startTime}
            onChange={(iso) => {
              if (iso) update("startTime", iso);
            }}
            required
            disabled={pending}
          />
        </Field>

        <Field
          label="End time"
          hint="Optional. Must be after start on the same calendar day or later. Same day as start for a single session (e.g. 23 Apr 13:00 = 1:00 PM — not 01:00, which is 1 AM)."
        >
          <DateTimePickerIST
            value={values.endTime ?? null}
            onChange={(iso) => update("endTime", iso ?? undefined)}
            disabled={pending}
          />
        </Field>
      </Section>

      <Section title="Tickets & pricing">
        <Field label="Regular price (₹)" hint="Leave blank for free events.">
          <Input
            type="number"
            min={0}
            step={1}
            value={values.ticketPrice ?? ""}
            onChange={(e) =>
              update(
                "ticketPrice",
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
            disabled={pending}
          />
        </Field>

        <Field
          label="Max tickets"
          hint="Optional capacity cap. Leave blank for unlimited."
        >
          <Input
            type="number"
            min={1}
            step={1}
            value={values.maxTickets ?? ""}
            onChange={(e) =>
              update(
                "maxTickets",
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
            disabled={pending}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Early-bird price (₹)"
            hint="Optional. Must be lower than regular price."
          >
            <Input
              type="number"
              min={0}
              step={1}
              value={values.earlyBirdPrice ?? ""}
              onChange={(e) =>
                update(
                  "earlyBirdPrice",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              disabled={pending}
            />
          </Field>

          <Field label="Early-bird ends at">
            <DateTimePickerIST
              value={values.earlyBirdEndsAt ?? null}
              onChange={(iso) => update("earlyBirdEndsAt", iso ?? undefined)}
              disabled={pending}
            />
          </Field>
        </div>
      </Section>

      <Section title="Cover image">
        <ImageUpload
          bucket="event-images"
          value={values.coverImage ?? null}
          onChange={(url) => update("coverImage", url ?? undefined)}
          label="Cover image"
          alt={values.title}
          disabled={pending}
        />
      </Section>

      <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create event"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-neutral-900">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
