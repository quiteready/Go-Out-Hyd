"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { AREAS, CAFES_AREA_SEARCH_PARAM } from "@/lib/constants/areas";
import { cn } from "@/lib/utils";

export function AreaFilterPills() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeArea = searchParams.get(CAFES_AREA_SEARCH_PARAM);

  const setArea = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set(CAFES_AREA_SEARCH_PARAM, slug);
      } else {
        params.delete(CAFES_AREA_SEARCH_PARAM);
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter cafes by area"
    >
      {/* All pill */}
      <button
        onClick={() => setArea(null)}
        aria-pressed={!activeArea}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
          !activeArea
            ? "bg-[#0a0a0a] text-[#fbf497] border-[#0a0a0a]"
            : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
        )}
      >
        All Areas
      </button>

      {/* Area pills */}
      {AREAS.map((area) => {
        const isActive = activeArea === area.slug;
        return (
          <button
            key={area.slug}
            onClick={() => setArea(isActive ? null : area.slug)}
            aria-pressed={isActive}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
              isActive
                ? "bg-[#0a0a0a] text-[#fbf497] border-[#0a0a0a]"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {area.name}
          </button>
        );
      })}
    </div>
  );
}
