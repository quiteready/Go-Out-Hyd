"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AREAS, cafesListingHref } from "@/lib/constants/areas";
import type { AreaSlug } from "@/lib/constants/areas";

// Static sample data per area — will be data-driven in a future iteration
const AREA_DATA: Record<
  AreaSlug,
  { sub: string; cafes: string[] }
> = {
  "banjara-hills": {
    sub: "The social hub — cafes, galleries, and late nights",
    cafes: ["Aromas of Coorg", "Bonne Bake & Brew", "The Parlour"],
  },
  "jubilee-hills": {
    sub: "Upscale dining meets indie culture",
    cafes: ["Filter Kaapi Co.", "Roastery Coffee House", "Smoor Chocolates"],
  },
  kondapur: {
    sub: "Tech corridors with a growing cafe scene",
    cafes: ["Third Wave Coffee", "Chaayos", "Brewberrys"],
  },
  gachibowli: {
    sub: "After-work spots and weekend brunches",
    cafes: ["Hacienda", "MOB — Ministry of Burgers", "Latitude 17"],
  },
  madhapur: {
    sub: "HITEC City's creative and social hangouts",
    cafes: ["Infinitea", "Olive Bistro", "The Hole in the Wall Cafe"],
  },
};

export function AreasSection() {
  const [activeSlug, setActiveSlug] = useState<AreaSlug | null>(null);
  const pearlRowRef = useRef<HTMLDivElement>(null);

  // Close the active card when clicking outside the pearl row
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        pearlRowRef.current &&
        !pearlRowRef.current.contains(e.target as Node)
      ) {
        setActiveSlug(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  return (
    <section
      id="areas"
      className="bg-[#0a0a0a] px-5 pb-[120px] pt-[88px] sm:px-6 sm:pb-[130px] sm:pt-[100px]"
    >
      {/* Section header */}
      <div className="mb-12 text-center" data-reveal>
        <h2 className="mb-[6px] font-sans font-medium text-[clamp(24px,4vw,36px)] text-white">
          Where
        </h2>
        <p className="text-[14px] font-light text-white/25">
          Five neighbourhoods. Tap a pearl.
        </p>
      </div>

      {/* Pearl row — connecting line handled by .pearl-row::before in globals.css */}
      <div
        ref={pearlRowRef}
        className="pearl-row relative mx-auto flex max-w-[560px] flex-wrap items-start justify-center gap-5 sm:gap-7"
      >
        {AREAS.map((area) => {
          const isActive = activeSlug === area.slug;
          const data = AREA_DATA[area.slug];

          return (
            <div
              key={area.slug}
              className={`pearl relative z-[1] cursor-pointer pt-1 [-webkit-tap-highlight-color:transparent]${
                isActive ? " active" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlug(isActive ? null : area.slug);
              }}
              role="button"
              aria-expanded={isActive}
              aria-label={`${area.name} — ${isActive ? "close" : "see cafes"}`}
            >
              {/* Glowing yellow pearl dot — styles in globals.css */}
              <div className="pearl-dot" />

              {/* Area label — fades out when card is active */}
              <span className="pearl-label mt-[10px] block whitespace-nowrap text-center text-[10px] tracking-[0.3px] text-white/30">
                {area.name}
              </span>

              {/* Pop-up glass card — spring animation via CSS cubic-bezier */}
              <div
                className="pearl-card-content"
                role="dialog"
                aria-label={`${area.name} cafes`}
              >
                <p className="mb-[3px] font-sans font-medium text-[16px] text-white">
                  {area.name}
                </p>
                <p className="mb-[14px] text-[11px] font-light text-white/35">
                  {data.sub}
                </p>
                {data.cafes.map((cafe) => (
                  <div key={cafe} className="pearl-cafe">
                    <div className="pearl-cafe-dot" />
                    {cafe}
                  </div>
                ))}
                <Link
                  href={cafesListingHref(area.slug)}
                  className="mt-4 block text-center text-[11px] font-medium text-yellow opacity-70 transition-opacity hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  See all cafes →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
