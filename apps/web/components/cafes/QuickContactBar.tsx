import { Phone, MapPin, Instagram } from "lucide-react";
import type { Cafe } from "@/lib/drizzle/schema";
import {
  displayInstagramLabel,
  resolveInstagramHref,
} from "@/lib/utils/instagram";
import { telHrefFromPhone } from "@/lib/utils/phone";

interface QuickContactBarProps {
  cafe: Cafe;
}

export function QuickContactBar({ cafe }: QuickContactBarProps) {
  const { phone, googleMapsUrl, instagramHandle, address } = cafe;

  const hasContact = phone ?? googleMapsUrl ?? instagramHandle ?? address;
  if (!hasContact) return null;

  const instagramUrl = resolveInstagramHref(instagramHandle);
  const telHref = telHrefFromPhone(phone);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {phone && telHref && (
          <a
            href={telHref}
            className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
          >
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            {phone}
          </a>
        )}

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
          >
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            Directions
          </a>
        )}

        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
          >
            <Instagram className="h-4 w-4 shrink-0 text-muted-foreground" />
            {displayInstagramLabel(instagramHandle)}
          </a>
        )}
      </div>

      {address && (
        <p className="mt-3 text-sm text-muted-foreground">{address}</p>
      )}
    </div>
  );
}
