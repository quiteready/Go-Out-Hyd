import type { ReactElement } from "react";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About",
    description:
      "GoOutHyd is Hyderabad's creative and cultural platform — connecting artists, organisers, venues, and people through live experiences.",
  };
}

export default function AboutPage(): ReactElement {
  return (
    <div>
      <section className="bg-[#0a0a0a] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-[14px] block text-[11px] font-medium uppercase tracking-[0.4em] text-yellow opacity-85">
            ABOUT
          </span>
          <h1 className="text-[2rem] font-medium leading-tight text-[#f8f7f2] sm:text-5xl sm:leading-tight">
            Hyderabad&apos;s home for live experiences
          </h1>
        </div>
      </section>

      <section className="bg-background px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-5 text-[15px] font-light leading-[1.85] text-muted-foreground">
          <p>
            We&apos;ve spent years putting together live events across Hyderabad
            — working with artists, DJs, bands, performers, and the spaces that
            host them. Too many great nights happened to half-empty rooms because
            the right people simply didn&apos;t hear about them.
          </p>
          <p>
            GoOutHyd is where that changes. One place to find what&apos;s
            happening — and for the people making it happen to be found. If you
            make things in this city, you should be on here.
          </p>
        </div>
      </section>

      <section className="bg-secondary px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <blockquote className="font-serif text-xl italic leading-snug text-foreground sm:text-2xl md:text-3xl">
            It&apos;s not just about finding what&apos;s on this weekend.
            It&apos;s about building a city where great things keep happening.
          </blockquote>
        </div>
      </section>

      <section className="bg-secondary px-4 py-14 sm:px-6 sm:pb-20">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <h2 className="text-2xl font-medium text-foreground sm:text-3xl">
            Want to be part of it?
          </h2>
          <Link
            href="/partner"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-[#0a0a0a] px-8 py-2.5 text-sm font-medium text-[#fbf497] transition-colors hover:bg-[#0a0a0a]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf497] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Partner with us
          </Link>
        </div>
      </section>
    </div>
  );
}
