export default function PartnerLoading() {
  return (
    <div className="font-body">
      <section className="bg-espresso px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="mx-auto h-12 w-full max-w-lg animate-pulse rounded-lg bg-cream/10" />
          <div className="mx-auto h-6 w-4/5 max-w-md animate-pulse rounded bg-cream/10" />
        </div>
      </section>

      <section className="bg-cream px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto h-9 w-64 animate-pulse rounded bg-roast/10" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-brand-border bg-foam p-6 shadow-sm"
              >
                <div className="h-12 w-12 animate-pulse rounded-lg bg-roast/10" />
                <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-roast/10" />
                <div className="mt-2 h-4 w-full animate-pulse rounded bg-roast/10" />
                <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-roast/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-milk px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto h-9 w-48 animate-pulse rounded bg-roast/10" />
          <div className="mt-10 flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-14 w-14 animate-pulse rounded-full bg-roast/10" />
                <div className="mt-4 h-4 w-40 animate-pulse rounded bg-roast/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream px-4 py-14 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-brand-border bg-foam p-6 shadow-sm">
          <div className="h-8 w-40 animate-pulse rounded bg-roast/10" />
          <div className="h-4 w-full animate-pulse rounded bg-roast/10" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-roast/10" />
              <div className="h-9 w-full animate-pulse rounded bg-roast/10" />
            </div>
          ))}
          <div className="h-10 w-full animate-pulse rounded-md bg-roast/10" />
        </div>
      </section>
    </div>
  );
}
