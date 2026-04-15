import type { ReactElement } from "react";
import Link from "next/link";

export function HeroSection(): ReactElement {
  return (
    <section className="w-full bg-espresso">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-[2rem] leading-tight text-cream sm:text-5xl sm:leading-tight">
            Your Weekend Starts Here
          </h1>
          <p className="mt-4 text-base text-foam/95 sm:text-lg">
            Discover Hyderabad&apos;s best independent cafes, live music nights,
            open mics, and more
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:mx-auto sm:max-w-md sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/cafes"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-caramel px-6 py-2.5 text-center text-sm font-medium text-foam transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-espresso"
            >
              Explore Cafes
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-caramel bg-transparent px-6 py-2.5 text-center text-sm font-medium text-caramel transition-colors hover:bg-caramel/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-espresso"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
