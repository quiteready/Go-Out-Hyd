"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/drizzle/db";
import { cafeLeads } from "@/lib/drizzle/schema/cafe-leads";
import { sendLeadNotification } from "@/lib/email";
import { partnerFormSchema } from "@/lib/validations/partner";

export type SubmitPartnerFormResult =
  | { success: true }
  | { success: false; error: string };

function getString(formData: FormData, key: string): string {
  const v = formData.get(key);
  if (typeof v !== "string") {
    return "";
  }
  return v;
}

export async function submitPartnerForm(
  _prevState: SubmitPartnerFormResult | null,
  formData: FormData,
): Promise<SubmitPartnerFormResult> {
  const honeypotRaw = getString(formData, "honeypot");
  if (honeypotRaw.length > 0) {
    return { success: true };
  }

  const raw = {
    owner_name: getString(formData, "owner_name"),
    cafe_name: getString(formData, "cafe_name"),
    phone: getString(formData, "phone"),
    area: getString(formData, "area"),
    description: getString(formData, "description") || undefined,
    instagram_handle: getString(formData, "instagram_handle") || undefined,
    honeypot: "",
  };

  const parsed = partnerFormSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check your entries.";
    return { success: false, error: message };
  }

  const data = parsed.data;

  try {
    const noteParts: string[] = [];
    if (data.instagram_handle) {
      noteParts.push(`Instagram: ${data.instagram_handle}`);
    }
    if (data.description) {
      noteParts.push(`About: ${data.description}`);
    }

    const [row] = await db
      .insert(cafeLeads)
      .values({
        ownerName: data.owner_name,
        cafeName: data.cafe_name,
        phone: data.phone,
        area: data.area,
        notes: noteParts.length > 0 ? noteParts.join("\n") : undefined,
      })
      .returning({ createdAt: cafeLeads.createdAt });

    if (!row) {
      return { success: false, error: "Could not save your request. Please try again." };
    }

    try {
      await sendLeadNotification({
        owner_name: data.owner_name,
        cafe_name: data.cafe_name,
        phone: data.phone,
        area: data.area,
        description: data.description,
        instagram_handle: data.instagram_handle,
        created_at: row.createdAt,
      });
    } catch {
      // Lead is persisted; email failure must not block success response
    }

    revalidatePath("/partner");
    return { success: true };
  } catch {
    return { success: false, error: "Could not save your request. Please try again." };
  }
}
