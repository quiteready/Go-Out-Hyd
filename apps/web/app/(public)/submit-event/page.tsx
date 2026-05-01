import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, Clock } from "lucide-react";

import { EventSubmitForm } from "@/components/submit-event/EventSubmitForm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Submit Your Event",
    description:
      "Running a live music night, open mic, workshop, or jamming session in Hyderabad? Submit your event to GoOut Hyd and reach thousands of people looking for something to do this weekend.",
  };
}

const steps = [
  {
    icon: CalendarCheck,
    title: "Fill in your event details",
  },
  {
    icon: Clock,
    title: "We review within 24 hours",
  },
  {
    icon: CheckCircle2,
    title: "Your event goes live on GoOut Hyd",
  },
] as const;

export default function SubmitEventPage() {
  return (
    <div>
      <section className="bg-[#0a0a0a] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-medium leading-tight text-[#f8f7f2] sm:text-5xl">
            Bring Your Event to Hyderabad
          </h1>
          <p className="mt-4 text-lg text-[#f8f7f2]/90 sm:text-xl">
            Live music, open mics, workshops, jamming sessions — if it&apos;s
            happening in the city, it belongs here.
          </p>
        </div>
      </section>

      <section className="bg-secondary px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-medium text-foreground sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-10 flex list-none flex-col items-center gap-6 md:flex-row md:justify-center md:gap-2">
            {steps.map(({ icon: Icon, title }, index) => (
              <li
                key={title}
                className="flex w-full max-w-[280px] flex-col items-center md:w-auto md:max-w-none md:flex-row md:items-center md:gap-4"
              >
                {index > 0 ? (
                  <span className="mb-2 text-foreground/30 md:mb-0 md:text-xl">
                    →
                  </span>
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
          <EventSubmitForm />
        </div>
      </section>
    </div>
  );
}
