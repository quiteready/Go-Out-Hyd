"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AREAS, CAFES_AREA_SEARCH_PARAM } from "@/lib/constants/areas";
import { cn } from "@/lib/utils";

export function AreaFilterPills() {
  const searchParams = useSearchParams();
  const activeArea = searchParams.get(CAFES_AREA_SEARCH_PARAM);

  return (
    <div
      className="flex items-center"
      role="group"
      aria-label="Filter cafes by area"
    >
      <div
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0"
      >
        {/* All pill */}
        <Link
          href="/cafes"
          aria-pressed={!activeArea}
          role="button"
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
            !activeArea
              ? "bg-[#0a0a0a] text-[#fbf497] border-[#0a0a0a]"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
          )}
        >
          All Areas
        </Link>

        {/* Area pills */}
        {AREAS.map((area) => {
          const isActive = activeArea === area.slug;
          return (
            <Link
              key={area.slug}
              href={
                isActive ? "/cafes" : `/cafes?${CAFES_AREA_SEARCH_PARAM}=${area.slug}`
              }
              aria-pressed={isActive}
              role="button"
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
                isActive
                  ? "bg-[#0a0a0a] text-[#fbf497] border-[#0a0a0a]"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {area.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
