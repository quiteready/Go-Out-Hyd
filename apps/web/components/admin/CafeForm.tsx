"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AREAS } from "@/lib/constants/areas";
import { slugify } from "@/lib/admin/slug";
import { createCafe, updateCafe } from "@/app/actions/admin/cafes";
import type { CafeFormValues } from "@/lib/validations/admin/cafe";
import type { Cafe } from "@/lib/drizzle/schema";

interface CafeFormProps {
  /** When editing, pass the existing cafe; omit for create. */
  cafe?: Cafe;
}

const AREA_OPTIONS = [...AREAS.map((a) => a.name), "Other"] as const;
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export function CafeForm({ cafe }: CafeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(cafe);
  const [pending, startTransition] = useTransition();

  const [values, setValues] = useState<CafeFormValues>({
    name: cafe?.name ?? "",
    slug: cafe?.slug ?? "",
    area: cafe?.area ?? AREA_OPTIONS[0],
    description: cafe?.description ?? undefined,
    coverImage: cafe?.coverImage ?? undefined,
    phone: cafe?.phone ?? undefined,
    instagramHandle: cafe?.instagramHandle ?? undefined,
    googleMapsUrl: cafe?.googleMapsUrl ?? undefined,
    address: cafe?.address ?? undefined,
    openingHours: cafe?.openingHours ?? undefined,
    status: cafe?.status ?? "active",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);

  function update<K extends keyof CafeFormValues>(
    key: K,
    value: CafeFormValues[K],
  ): void {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string): void {
    update("name", name);
    if (!slugManuallyEdited) {
      update("slug", slugify(name));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    startTransition(async () => {
      const action = isEdit && cafe ? updateCafe(cafe.id, values) : createCafe(values);
      const result = await action;
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Cafe updated" : "Cafe created");
      if (isEdit) {
        router.refresh();
      } else {
        router.push(`/admin/cafes/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Basics">
        <Field label="Name" required>
          <Input
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            disabled={pending}
          />
        </Field>

        <Field
          label="Slug"
          required
          hint="Used in the public URL: /cafes/[slug]. Lowercase letters, numbers, hyphens."
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

        <Field label="Area" required>
          <Select
            value={values.area}
            onValueChange={(v) => update("area", v)}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AREA_OPTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Status" required>
          <Select
            value={values.status}
            onValueChange={(v) =>
              update("status", v as CafeFormValues["status"])
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

        <Field label="Description" hint="Shown on the public cafe page.">
          <Textarea
            value={values.description ?? ""}
            onChange={(e) => update("description", e.target.value || undefined)}
            rows={4}
            disabled={pending}
          />
        </Field>
      </Section>

      <Section title="Cover image">
        <ImageUpload
          bucket="cafe-images"
          value={values.coverImage ?? null}
          onChange={(url) => update("coverImage", url ?? undefined)}
          label="Cover image"
          alt={values.name}
          disabled={pending}
        />
      </Section>

      <Section title="Contact & links">
        <Field
          label="Phone"
          hint="Indian mobile with country code. Shown on the public café page."
        >
          <Input
            value={values.phone ?? ""}
            onChange={(e) => update("phone", e.target.value || undefined)}
            placeholder="+91 98765 43210"
            disabled={pending}
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>

        <Field
          label="Instagram handle"
          hint="Handle (e.g. srea_handcraftedsoaps) or full profile URL — up to 200 characters."
        >
          <Input
            value={values.instagramHandle ?? ""}
            onChange={(e) =>
              update("instagramHandle", e.target.value || undefined)
            }
            placeholder="srea_handcraftedsoaps"
            disabled={pending}
            autoComplete="off"
          />
        </Field>

        <Field label="Google Maps URL">
          <Input
            value={values.googleMapsUrl ?? ""}
            onChange={(e) =>
              update("googleMapsUrl", e.target.value || undefined)
            }
            placeholder="https://maps.google.com/…"
            disabled={pending}
          />
        </Field>

        <Field label="Address">
          <Textarea
            value={values.address ?? ""}
            onChange={(e) => update("address", e.target.value || undefined)}
            rows={2}
            disabled={pending}
          />
        </Field>

        <Field label="Opening hours" hint="Free-text. e.g. “Mon–Sun, 8 AM – 11 PM”.">
          <Input
            value={values.openingHours ?? ""}
            onChange={(e) =>
              update("openingHours", e.target.value || undefined)
            }
            disabled={pending}
          />
        </Field>
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
          {isEdit ? "Save changes" : "Create cafe"}
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
