"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface Category {
  value: string | null;
  label: string;
}

const CATEGORIES: Category[] = [
  { value: null, label: "All Events" },
  { value: "live_music", label: "Live Music" },
  { value: "open_mic", label: "Open Mic" },
  { value: "workshop", label: "Workshop" },
  { value: "comedy_night", label: "Comedy Night" },
  { value: "gaming", label: "Gaming" },
];

export function CategoryFilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  const setCategory = useCallback(
    (value: string | null) => {
      if (value) {
        router.push(`/events?category=${value}`);
      } else {
        router.push("/events");
      }
    },
    [router],
  );

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="group"
      aria-label="Filter events by category"
    >
      {CATEGORIES.map(({ value, label }) => {
        const isActive =
          value === null ? !activeCategory : activeCategory === value;
        return (
          <button
            key={label}
            type="button"
            onClick={() => setCategory(value)}
            aria-pressed={isActive}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2",
              isActive
                ? "bg-caramel text-white"
                : "bg-milk text-roast/70 hover:bg-cream hover:text-espresso",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
