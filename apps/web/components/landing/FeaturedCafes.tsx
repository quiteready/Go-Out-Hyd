import type { ReactElement } from "react";
import Link from "next/link";
import { CafeCard } from "@/components/cafes/CafeCard";
import type { Cafe } from "@/lib/drizzle/schema";

interface FeaturedCafesProps {
  cafes: Cafe[];
}

export function FeaturedCafes({ cafes }: FeaturedCafesProps): ReactElement {
  return (
    <section className="w-full bg-milk py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-3xl text-espresso sm:text-4xl">
          Cafes Worth the Drive
        </h2>
        {cafes.length > 0 ? (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>
            <div className="mt-10 flex justify-end">
              <Link
                href="/cafes"
                className="text-sm font-medium text-caramel transition-colors hover:text-caramel/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-milk"
              >
                See All Cafes →
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-8 text-center text-roast/70">
            Featured cafes will appear here soon.
          </p>
        )}
      </div>
    </section>
  );
}
