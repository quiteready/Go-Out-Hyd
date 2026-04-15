import type { ReactElement } from "react";

export default function AboutLoading(): ReactElement {
  return (
    <div className="font-body">
      <section className="bg-espresso px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="mx-auto h-14 w-full max-w-xl animate-pulse rounded-lg bg-cream/10" />
        </div>
      </section>

      <section className="bg-cream px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-4 w-full animate-pulse rounded bg-roast/10" />
          <div className="h-4 w-full animate-pulse rounded bg-roast/10" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-roast/10" />
          <div className="h-4 w-full animate-pulse rounded bg-roast/10" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-roast/10" />
        </div>
      </section>

      <section className="bg-milk px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="mx-auto h-6 w-full max-w-2xl animate-pulse rounded bg-roast/10" />
          <div className="mx-auto h-6 w-4/5 max-w-xl animate-pulse rounded bg-roast/10" />
        </div>
      </section>

      <section className="bg-cream px-4 py-14 sm:px-6 sm:pb-20">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <div className="h-9 w-56 animate-pulse rounded bg-roast/10" />
          <div className="mt-6 h-11 w-40 animate-pulse rounded-md bg-roast/10" />
          <div className="mt-8 h-5 w-28 animate-pulse rounded bg-roast/10" />
        </div>
      </section>
    </div>
  );
}
