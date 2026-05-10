import type { Metadata } from "next";

import { PageHero } from "@/components/layout/PageHero";
import { EventSubmitForm } from "@/components/submit-event/EventSubmitForm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Submit Your Event",
    description:
      "Running a live music night, open mic, workshop, or jamming session in Hyderabad? Submit your event to GoOut Hyd and reach thousands of people looking for something to do this weekend.",
  };
}

const steps = [
  { title: "Fill in your event details" },
  { title: "We review within 24 hours" },
  { title: "Your event goes live on GoOut Hyd" },
];

export default function SubmitEventPage() {
  return (
    <div>
      <PageHero
        eyebrow="SUBMIT AN EVENT"
        title="Bring your event to Hyderabad"
        lead="Live music, open mics, workshops, jamming sessions — if it's happening in the city, it belongs here."
      />

      <section className="bg-secondary px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-medium text-foreground sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-10 flex list-none flex-col items-center gap-6 md:flex-row md:justify-center md:gap-2">
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
          <EventSubmitForm />
        </div>
      </section>
    </div>
  );
}
