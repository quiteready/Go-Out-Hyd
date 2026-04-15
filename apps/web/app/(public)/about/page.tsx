import type { ReactElement } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Instagram } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About",
    description: "The story behind Hyderabad's cafe discovery platform",
  };
}

export default function AboutPage(): ReactElement {
  return (
    <div className="font-body">
      <section className="bg-espresso px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-[2rem] leading-tight text-cream sm:text-5xl sm:leading-tight">
            Built in Hyderabad, for Hyderabad
          </h1>
        </div>
      </section>

      <section className="bg-cream px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-roast sm:text-lg">
          <p>
            GoOut Hyd grew out of years of running live events across the city.
            Wilson has worked with artists, venues, and crowds long enough to know
            what makes a night memorable — and how hard it can be for independent
            cafes to fill seats when nobody knows they exist.
          </p>
          <p>
            Along the way, the same cafe owners kept showing up: passionate about
            coffee and community, but stretched thin on marketing and discovery.
            Chains have budgets; neighbourhood spots rely on word of mouth and a
            few regulars. We built relationships with those owners because we
            believed their spaces deserved the audience.
          </p>
          <p>
            GoOut Hyd connects that network with people looking for something
            real — open mics, live sets, workshops, and quiet corners worth
            crossing town for. One place to browse cafes by area, see what&apos;s
            on this week, and walk in knowing you&apos;re supporting Hyderabad&apos;s
            independents.
          </p>
        </div>
      </section>

      <section className="bg-milk px-4 py-14 sm:px-6 sm:py-16">
        <blockquote className="mx-auto max-w-3xl text-center font-heading text-xl italic leading-snug text-espresso sm:text-2xl md:text-3xl">
          We believe Hyderabad&apos;s best experiences happen at independent
          cafes, not chains. GoOut Hyd exists to make sure you never miss them.
        </blockquote>
      </section>

      <section className="bg-cream px-4 py-14 sm:px-6 sm:pb-20">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <h2 className="font-heading text-2xl text-espresso sm:text-3xl">
            Want to partner with us?
          </h2>
          <Link
            href="/partner"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-caramel px-8 py-2.5 text-sm font-medium text-foam transition-colors hover:bg-caramel/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            List Your Cafe
          </Link>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-caramel transition-colors hover:text-caramel/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            aria-label="GoOut Hyd on Instagram (placeholder link)"
          >
            <Instagram className="h-5 w-5 shrink-0" aria-hidden />
            <span>Instagram</span>
          </a>
        </div>
      </section>
    </div>
  );
}
