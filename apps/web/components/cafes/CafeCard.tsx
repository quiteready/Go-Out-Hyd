import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Cafe } from "@/lib/drizzle/schema";

interface CafeCardProps {
  cafe: Cafe;
}

/**
 * Static area-to-vibes map used until the schema gains a dedicated tags field.
 * Replace with schema-driven data once available.
 */
const AREA_VIBES: Record<string, string[]> = {
  "Banjara Hills": ["Specialty Coffee", "Live Music"],
  "Jubilee Hills": ["Art Space", "Workshop Space"],
  Kondapur: ["Quiet Space", "Board Games"],
  Gachibowli: ["Open Mic", "Art Space"],
  Madhapur: ["Rooftop", "Live Music"],
  "Hitech City": ["Gaming", "Specialty Coffee"],
};

export function CafeCard({ cafe }: CafeCardProps) {
  const vibes = AREA_VIBES[cafe.area] ?? [];

  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group block overflow-hidden rounded-2xl border border-brand-border bg-foam shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover image */}
      <div className="relative h-48 w-full overflow-hidden bg-roast/10">
        {cafe.coverImage ? (
          <Image
            src={cafe.coverImage}
            alt={`${cafe.name} cover photo`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-caramel/5">
            <span className="font-heading text-3xl text-caramel/40">
              {cafe.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Vibe tag pills — only rendered when tags exist */}
        {vibes.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {vibes.slice(0, 2).map((vibe) => (
              <span
                key={vibe}
                className="rounded-full bg-milk px-2.5 py-0.5 text-xs font-medium text-roast/70"
              >
                {vibe}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-heading text-lg text-espresso transition-colors line-clamp-1 group-hover:text-caramel">
          {cafe.name}
        </h3>

        {/* Area */}
        <div className="mt-2 flex items-center gap-1 text-sm text-roast/60">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          <span>{cafe.area}</span>
        </div>
      </div>
    </Link>
  );
}
