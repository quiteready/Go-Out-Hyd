import type { ReactElement } from "react";
import Link from "next/link";
import { AREAS, cafesListingHref } from "@/lib/constants/areas";

export function BrowseByArea(): ReactElement {
  return (
    <section className="w-full bg-cream py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-3xl text-espresso sm:text-4xl">
          Find Your Spot
        </h2>
        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          role="list"
        >
          {AREAS.map((area) => (
            <Link
              key={area.slug}
              href={cafesListingHref(area.slug)}
              role="listitem"
              className="rounded-full border border-brand-border bg-foam/80 px-5 py-2 text-sm font-medium text-roast transition-colors hover:border-caramel hover:bg-caramel hover:text-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {area.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
