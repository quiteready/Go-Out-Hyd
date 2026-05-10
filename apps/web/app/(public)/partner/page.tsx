import type { Metadata } from "next";

import { PageHero } from "@/components/layout/PageHero";
import { PartnerForm } from "@/components/partner/PartnerForm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "List Your Cafe",
    description:
      "Join Hyderabad's only platform built for independent cafes. Get discovered, host events, and grow your tables — request a callback from GoOut Hyd.",
  };
}

const valueCards = [
  {
    emoji: "☕",
    title: "Own a cafe?",
    body: "Get listed where the long-table crowd actually looks. Photos, menu, events — all on one page.",
  },
  {
    emoji: "🎤",
    title: "Running events?",
    body: "Open mics, gigs, workshops — we'll put it in front of the people who care.",
  },
  {
    emoji: "📍",
    title: "Have a space to host?",
    body: "Got a rooftop, a basement, a back room? We'll match it to organisers looking for venues.",
  },
  {
    emoji: "💰",
    title: "Pricing? It's simple.",
    body: "Free to list. Pay only when you sell tickets through us. No upfront fees, no contracts.",
  },
];

const steps = [
  { title: "Fill the form below" },
  { title: "We'll call you within 24 hours" },
  { title: "Your cafe goes live in days" },
];

export default function PartnerPage() {
  return (
    <div>
      <PageHero
        eyebrow="PARTNER WITH US"
        title="Your cafe deserves to be discovered"
        lead="Join Hyderabad's only platform built for independent cafes"
      />

      <section className="bg-background px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-medium text-foreground sm:text-3xl">
            Why partner with us
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:gap-8">
            {valueCards.map(({ emoji, title, body }) => (
              <div
                key={title}
                className="rounded-[10px] border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden="true">{emoji}</span>
                <h3 className="mt-4 text-xl font-medium text-foreground">{title}</h3>
                <p className="mt-2 text-base text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-medium text-foreground sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-10 flex list-none flex-col items-center gap-6 md:flex-row md:flex-wrap md:justify-center md:gap-2">
            {steps.map(({ title }, index) => (
              <li
                key={title}
                className="flex w-full max-w-[280px] flex-col items-center md:w-auto md:max-w-none md:flex-row md:items-center md:gap-4"
              >
                {index > 0 && (
                  <span className="hidden h-px w-12 bg-foreground/15 md:block" aria-hidden="true" />
                )}
                <div className="flex w-full flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                    <span className="text-sm font-medium tracking-[0.1em] text-foreground/40">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-4 font-medium text-foreground">{title}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-background px-4 py-14 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-lg">
          <PartnerForm />
        </div>
      </section>
    </div>
  );
}
