import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Cafe } from "@/lib/drizzle/schema";

interface CustomVenue {
  name: string;
  address: string | null;
  mapsUrl: string | null;
}

interface VenueSectionProps {
  cafe?: Cafe | null;
  venue?: CustomVenue | null;
}

export function VenueSection({ cafe, venue }: VenueSectionProps) {
  if (cafe) {
    return <CafeVenue cafe={cafe} />;
  }
  if (venue) {
    return <CustomVenueBlock venue={venue} />;
  }
  return null;
}

function CafeVenue({ cafe }: { cafe: Cafe }) {
  return (
    <section className="bg-milk py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-heading text-3xl text-espresso">Venue</h2>

        <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-foam p-4 shadow-sm">
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

          <div>
            <p className="font-medium text-espresso">{cafe.name}</p>
            <p className="mt-0.5 text-sm text-roast/70">{cafe.area}</p>
          </div>
        </div>

        {cafe.googleMapsUrl && (
          <div className="mt-5">
            <a
              href={cafe.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-espresso transition-colors hover:text-caramel"
            >
              <MapPin className="h-4 w-4 text-caramel" />
              Get Directions
            </a>
          </div>
        )}

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

function CustomVenueBlock({ venue }: { venue: CustomVenue }) {
  return (
    <section className="bg-milk py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-heading text-3xl text-espresso">Venue</h2>

        <div className="rounded-2xl border border-brand-border bg-foam p-6 shadow-sm">
          <p className="font-medium text-espresso">{venue.name}</p>
          {venue.address && (
            <p className="mt-1 text-sm text-roast/70">{venue.address}</p>
          )}

          {venue.mapsUrl && (
            <div className="mt-4">
              <a
                href={venue.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-espresso transition-colors hover:text-caramel"
              >
                <MapPin className="h-4 w-4 text-caramel" />
                Get Directions
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
