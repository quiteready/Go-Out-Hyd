"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  LayoutGrid,
  Guitar,
  Mic,
  Palette,
  Laugh,
  Gamepad2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  value: string | null;
  label: string;
  Icon: LucideIcon;
}

const CATEGORIES: Category[] = [
  { value: null, label: "All", Icon: LayoutGrid },
  { value: "live_music", label: "Live Music", Icon: Guitar },
  { value: "open_mic", label: "Open Mic", Icon: Mic },
  { value: "workshop", label: "Workshop", Icon: Palette },
  { value: "comedy_night", label: "Comedy Night", Icon: Laugh },
  { value: "gaming", label: "Gaming", Icon: Gamepad2 },
];

export function CategoryFilterCards() {
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
      className="flex gap-3 overflow-x-auto pb-2"
      role="group"
      aria-label="Filter events by category"
    >
      {CATEGORIES.map(({ value, label, Icon }) => {
        const isActive =
          value === null ? !activeCategory : activeCategory === value;
        return (
          <button
            key={label}
            onClick={() => setCategory(value)}
            aria-pressed={isActive}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "border-caramel bg-caramel text-foam"
                : "border-brand-border bg-foam text-espresso hover:border-caramel hover:text-caramel",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
