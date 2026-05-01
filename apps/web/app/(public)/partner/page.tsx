import type { Metadata } from "next";
import {
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Music,
  Phone,
  Rocket,
  Search,
  TrendingUp,
} from "lucide-react";

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
    icon: Search,
    title: "Get Discovered",
    body: "Your cafe listed with photos, menu, and contact info where customers are looking.",
  },
  {
    icon: TrendingUp,
    title: "Fill Empty Tables",
    body: "Reach thousands of experience-seeking customers in your area.",
  },
  {
    icon: Music,
    title: "Host Events Effortlessly",
    body: "We bring the bands, manage the logistics, you just host.",
  },
  {
    icon: CircleDollarSign,
    title: "Plans Starting at ₹999/month",
    body: "Affordable digital presence with no long-term contracts.",
  },
] as const;

const steps = [
  {
    icon: FileText,
    title: "Fill the form below",
  },
  {
    icon: Phone,
    title: "We'll call you within 24 hours",
  },
  {
    icon: Rocket,
    title: "Your cafe goes live in days",
  },
] as const;

export default function PartnerPage() {
  return (
    <div>
      <section className="bg-[#0a0a0a] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-medium leading-tight text-[#f8f7f2] sm:text-5xl">
            Your Cafe Deserves to Be Discovered
          </h1>
          <p className="mt-4 text-lg text-[#f8f7f2]/90 sm:text-xl">
            Join Hyderabad&apos;s only platform built for independent cafes
          </p>
        </div>
      </section>

      <section className="bg-background px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-medium text-foreground sm:text-3xl">
            Why partner with us
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:gap-8">
            {valueCards.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground/8 text-foreground">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
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
            {steps.map(({ icon: Icon, title }, index) => (
              <li
                key={title}
                className="flex w-full max-w-[280px] flex-col items-center md:w-auto md:max-w-none md:flex-row md:items-center md:gap-4"
              >
                {index > 0 ? (
                  <>
                    <ChevronDown
                      className="mb-2 h-6 w-6 shrink-0 text-foreground/30 md:mb-0 md:hidden"
                      aria-hidden
                    />
                    <ChevronRight
                      className="mb-2 hidden h-6 w-6 shrink-0 text-foreground/30 md:mb-0 md:block"
                      aria-hidden
                    />
                  </>
                ) : null}
                <div className="flex w-full flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/8 text-foreground">
                    <span className="sr-only">Step {index + 1}</span>
                    <Icon className="h-7 w-7" aria-hidden />
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
