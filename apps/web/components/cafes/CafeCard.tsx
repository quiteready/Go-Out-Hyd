import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Cafe } from "@/lib/drizzle/schema";

interface CafeCardProps {
  cafe: Cafe;
}

export function CafeCard({ cafe }: CafeCardProps) {
  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group block overflow-hidden rounded-2xl bg-foam border border-brand-border shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover image */}
      <div className="relative h-48 w-full overflow-hidden bg-roast/20">
        {cafe.coverImage ? (
          <Image
            src={cafe.coverImage}
            alt={`${cafe.name} cover photo`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-roast/30 to-caramel/20">
            <span className="font-heading text-3xl text-caramel/60">
              {cafe.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-heading text-lg text-espresso group-hover:text-caramel transition-colors line-clamp-1">
          {cafe.name}
        </h3>

        {/* Area tag */}
        <div className="mt-2 flex items-center gap-1 text-sm text-roast/70">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{cafe.area}</span>
        </div>
      </div>
    </Link>
  );
}
