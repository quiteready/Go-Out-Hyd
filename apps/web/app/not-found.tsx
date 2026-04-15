import type { ReactElement } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-grow flex-col items-center justify-center bg-cream px-4 py-20 text-center">
        <p className="font-body text-sm font-medium uppercase tracking-widest text-caramel">
          404
        </p>
        <h1 className="font-heading mt-4 text-4xl leading-tight text-espresso sm:text-5xl">
          Page not found
        </h1>
        <p className="font-body mt-4 max-w-md text-base leading-relaxed text-roast">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
          Try browsing cafes or upcoming events instead.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/cafes"
            className="inline-flex min-h-11 w-40 items-center justify-center rounded-md bg-caramel px-6 py-2.5 text-sm font-medium text-foam transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Browse Cafes
          </Link>
          <Link
            href="/events"
            className="inline-flex min-h-11 w-40 items-center justify-center rounded-md border border-caramel px-6 py-2.5 text-sm font-medium text-caramel transition-colors hover:bg-caramel/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            See Events
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
