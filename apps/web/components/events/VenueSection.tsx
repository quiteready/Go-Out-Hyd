import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, Instagram } from "lucide-react";
import type { Cafe } from "@/lib/drizzle/schema";

interface VenueSectionProps {
  cafe: Cafe;
}

export function VenueSection({ cafe }: VenueSectionProps) {
  const instagramUrl = cafe.instagramHandle
    ? `https://instagram.com/${cafe.instagramHandle.replace(/^@/, "")}`
    : null;

  const hasContact = cafe.phone ?? cafe.googleMapsUrl ?? instagramUrl;

  return (
    <section className="bg-milk py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-heading text-3xl text-espresso">Venue</h2>

        {/* Mini cafe card */}
        <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-foam p-4 shadow-sm">
          {/* Cover thumbnail */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-roast/20">
            {cafe.coverImage ? (
              <Image
                src={cafe.coverImage}
                alt={cafe.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-roast/30 to-caramel/20">
                <span className="font-heading text-xl text-caramel/60">
                  {cafe.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Cafe name and area */}
          <div>
            <p className="font-medium text-espresso">{cafe.name}</p>
            <p className="mt-0.5 text-sm text-roast/70">{cafe.area}</p>
          </div>
        </div>

        {/* Contact row */}
        {hasContact && (
          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {cafe.phone && (
              <a
                href={`tel:${cafe.phone}`}
                className="flex items-center gap-2 text-sm font-medium text-espresso transition-colors hover:text-caramel"
              >
                <Phone className="h-4 w-4 text-caramel" />
                {cafe.phone}
              </a>
            )}

            {cafe.googleMapsUrl && (
              <a
                href={cafe.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-espresso transition-colors hover:text-caramel"
              >
                <MapPin className="h-4 w-4 text-caramel" />
                Get Directions
              </a>
            )}

            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-espresso transition-colors hover:text-caramel"
              >
                <Instagram className="h-4 w-4 text-caramel" />
                {cafe.instagramHandle?.startsWith("@")
                  ? cafe.instagramHandle
                  : `@${cafe.instagramHandle}`}
              </a>
            )}
          </div>
        )}

        {/* View full profile link */}
        <div className="mt-6">
          <Link
            href={`/cafes/${cafe.slug}`}
            className="font-medium text-caramel transition-colors hover:text-roast"
          >
            View Full Cafe Profile →
          </Link>
        </div>
      </div>
    </section>
  );
}
