import type { ReactElement } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-grow flex-col items-center justify-center bg-background px-4 py-20 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-[#fbf497]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-medium leading-tight text-foreground sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
          Try browsing cafes or upcoming events instead.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/cafes"
            className="inline-flex min-h-11 w-40 items-center justify-center rounded-md bg-[#0a0a0a] px-6 py-2.5 text-sm font-medium text-[#fbf497] transition-colors hover:bg-[#0a0a0a]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf497] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Browse Cafes
          </Link>
          <Link
            href="/events"
            className="inline-flex min-h-11 w-40 items-center justify-center rounded-md border border-foreground/20 px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf497] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            See Events
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
