"use client";

import Link from "next/link";
import { AREAS, cafesListingHref } from "@/lib/constants/areas";

export function AreasSection() {
  const desktopRows = [AREAS.slice(0, 5), AREAS.slice(5)];
  const mobileRows = [AREAS.slice(0, 3), AREAS.slice(3, 6), AREAS.slice(6)];

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
          Hyderabad neighbourhoods
        </p>
      </div>

      {/* Mobile rows (3-3-3) */}
      <div className="mx-auto flex max-w-[420px] flex-col sm:hidden">
        {mobileRows.map((row, rowIndex) => {
          const hasNext = rowIndex < mobileRows.length - 1;
          const curveFlip = rowIndex % 2 === 1;

          return (
            <div
              key={`m-${rowIndex}`}
              className={`relative ${hasNext ? "pb-14" : ""}`}
            >
              <div className="pearl-row relative mx-auto flex w-fit items-start justify-center gap-5">
                {row.map((area) => (
                  <Link
                    href={cafesListingHref(area.slug)}
                    key={area.slug}
                    className="pearl relative z-[1] inline-flex w-[86px] cursor-pointer flex-col items-center pt-1 transition-opacity hover:opacity-100 [-webkit-tap-highlight-color:transparent]"
                    aria-label={`See cafes in ${area.name}`}
                  >
                    <div className="pearl-dot" />
                    <span className="pearl-label mt-[10px] block whitespace-nowrap text-center text-[10px] tracking-[0.3px] text-white/60">
                      {area.name}
                    </span>
                  </Link>
                ))}
              </div>

              {hasNext && (
                <svg
                  className={`pearl-road-curve ${curveFlip ? "pearl-road-curve--flip" : ""}`}
                  viewBox="0 0 100 64"
                  aria-hidden="true"
                >
                  <path d="M0 0 C55 0, 45 64, 100 64" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop/tablet rows (5-4) */}
      <div className="mx-auto hidden max-w-[860px] flex-col sm:flex">
        {desktopRows.map((row, rowIndex) => {
          const hasNext = rowIndex < desktopRows.length - 1;

          return (
            <div
              key={`d-${rowIndex}`}
              className={`relative ${hasNext ? "pb-12" : ""}`}
            >
              <div className="pearl-row relative mx-auto flex w-fit items-start justify-center gap-7">
                {row.map((area) => (
                  <Link
                    href={cafesListingHref(area.slug)}
                    key={area.slug}
                    className="pearl relative z-[1] inline-flex w-[86px] cursor-pointer flex-col items-center pt-1 transition-opacity hover:opacity-100 [-webkit-tap-highlight-color:transparent]"
                    aria-label={`See cafes in ${area.name}`}
                  >
                    <div className="pearl-dot" />
                    <span className="pearl-label mt-[10px] block whitespace-nowrap text-center text-[10px] tracking-[0.3px] text-white/60">
                      {area.name}
                    </span>
                  </Link>
                ))}
              </div>

              {hasNext && (
                <svg
                  className="pearl-road-curve pearl-road-curve--desktop"
                  viewBox="0 0 100 64"
                  aria-hidden="true"
                >
                  <path d="M0 0 C55 0, 45 64, 100 64" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
