import { Phone, MapPin, Instagram } from "lucide-react";
import type { Cafe } from "@/lib/drizzle/schema";

interface QuickContactBarProps {
  cafe: Cafe;
}

export function QuickContactBar({ cafe }: QuickContactBarProps) {
  const { phone, googleMapsUrl, instagramHandle, address } = cafe;

  const hasContact = phone ?? googleMapsUrl ?? instagramHandle ?? address;
  if (!hasContact) return null;

  const instagramUrl = instagramHandle
    ? `https://instagram.com/${instagramHandle.replace(/^@/, "")}`
    : null;

  return (
    <div className="mt-6 rounded-2xl border border-brand-border bg-foam p-5 shadow-sm">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 text-sm font-medium text-espresso transition-colors hover:text-caramel"
          >
            <Phone className="h-4 w-4 shrink-0 text-caramel" />
            {phone}
          </a>
        )}

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-espresso transition-colors hover:text-caramel"
          >
            <MapPin className="h-4 w-4 shrink-0 text-caramel" />
            Directions
          </a>
        )}

        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-espresso transition-colors hover:text-caramel"
          >
            <Instagram className="h-4 w-4 shrink-0 text-caramel" />
            {instagramHandle?.startsWith("@")
              ? instagramHandle
              : `@${instagramHandle}`}
          </a>
        )}
      </div>

      {address && (
        <p className="mt-3 text-sm text-roast/70">{address}</p>
      )}
    </div>
  );
}
