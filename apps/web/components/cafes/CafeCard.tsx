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
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover image */}
      <div className="relative h-48 w-full overflow-hidden bg-secondary">
        {cafe.coverImage ? (
          <Image
            src={cafe.coverImage}
            alt={`${cafe.name} cover photo`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-foreground/5">
            <span className="text-3xl font-medium text-foreground/20">
              {cafe.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-foreground line-clamp-1 transition-transform group-hover:-translate-y-[3px]">
          {cafe.name}
        </h3>

        {/* Area */}
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>{cafe.area}</span>
        </div>
      </div>
    </Link>
  );
}
