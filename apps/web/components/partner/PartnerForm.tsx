"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  submitPartnerForm,
  type SubmitPartnerFormResult,
} from "@/app/actions/leads";
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
import { PARTNER_AREA_OPTIONS, partnerFormSchema } from "@/lib/validations/partner";

function getStringFromFormData(fd: FormData, key: string): string {
  const v = fd.get(key);
  if (typeof v !== "string") {
    return "";
  }
  return v;
}

export function PartnerForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [area, setArea] = useState<string>("");
  const [state, formAction, isPending] = useActionState(
    submitPartnerForm,
    null as SubmitPartnerFormResult | null,
  );

  useEffect(() => {
    if (state === null) {
      return;
    }
    if (state.success) {
      toast.success("Thanks! We'll reach out within 24 hours");
      formRef.current?.reset();
      setArea("");
      return;
    }
    toast.error(state.error);
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const fd = new FormData(e.currentTarget);
    const raw = {
      owner_name: getStringFromFormData(fd, "owner_name"),
      cafe_name: getStringFromFormData(fd, "cafe_name"),
      phone: getStringFromFormData(fd, "phone"),
      area: getStringFromFormData(fd, "area"),
      description: getStringFromFormData(fd, "description") || undefined,
      instagram_handle: getStringFromFormData(fd, "instagram_handle") || undefined,
      honeypot: getStringFromFormData(fd, "honeypot"),
    };
    const parsed = partnerFormSchema.safeParse(raw);
    if (!parsed.success) {
      e.preventDefault();
      const msg = parsed.error.issues[0]?.message ?? "Please check your entries.";
      toast.error(msg);
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-medium text-foreground">
          Get started
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Tell us about you and your cafe — we&apos;ll call you within 24 hours.
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
            <Label htmlFor="owner_name">Owner name</Label>
            <Input
              id="owner_name"
              name="owner_name"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cafe_name">Cafe name</Label>
            <Input
              id="cafe_name"
              name="cafe_name"
              type="text"
              autoComplete="organization"
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Area / location</Label>
            <input type="hidden" name="area" value={area} readOnly />
            <Select value={area || undefined} onValueChange={setArea}>
              <SelectTrigger
                id="area"
                className="w-full"
                aria-label="Area or location"
              >
                <SelectValue placeholder="Select your area" />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_AREA_OPTIONS.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram_handle">
              Instagram handle{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="instagram_handle"
              name="instagram_handle"
              type="text"
              placeholder="@yourcafe"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              Tell us about your cafe{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What makes your cafe special? Ambiance, specialties, events you host..."
              maxLength={500}
              rows={4}
              className="resize-none"
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
                Sending…
              </>
            ) : (
              "Request a callback"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
