import type { ReactElement } from "react";
import Link from "next/link";

export function PartnerCTABanner(): ReactElement {
  return (
    <section className="w-full bg-espresso">
      <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <h2 className="font-heading text-2xl text-cream sm:text-3xl md:text-4xl">
          Own a Cafe? Let Hyderabad Find You
        </h2>
        <div className="mt-8">
          <Link
            href="/partner"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-caramel px-8 py-2.5 text-sm font-medium text-foam transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-espresso"
          >
            List Your Cafe
          </Link>
        </div>
      </div>
    </section>
  );
}
