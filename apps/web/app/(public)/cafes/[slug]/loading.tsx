export default function CafeProfileLoading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="h-72 w-full animate-pulse bg-roast/20 sm:h-96" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Contact bar skeleton */}
        <div className="mt-6 rounded-2xl border border-brand-border bg-foam p-5">
          <div className="flex flex-wrap gap-6">
            <div className="h-5 w-32 animate-pulse rounded bg-roast/10" />
            <div className="h-5 w-28 animate-pulse rounded bg-roast/10" />
            <div className="h-5 w-36 animate-pulse rounded bg-roast/10" />
          </div>
          <div className="mt-3 h-4 w-56 animate-pulse rounded bg-roast/10" />
        </div>

        <div className="space-y-14 py-12">
          {/* About skeleton */}
          <section>
            <div className="mb-4 h-8 w-24 animate-pulse rounded bg-roast/10" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-roast/10" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-roast/10" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-roast/10" />
            </div>
          </section>

          {/* Events skeleton */}
          <section>
            <div className="mb-4 h-8 w-48 animate-pulse rounded bg-roast/10" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 w-44 shrink-0 animate-pulse rounded-xl bg-roast/10"
                />
              ))}
            </div>
          </section>

          {/* Menu skeleton */}
          <section>
            <div className="mb-4 h-8 w-40 animate-pulse rounded bg-roast/10" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-40 animate-pulse rounded bg-roast/10" />
                  <div className="h-4 w-12 animate-pulse rounded bg-roast/10" />
                </div>
              ))}
            </div>
          </section>

          {/* Gallery skeleton */}
          <section>
            <div className="mb-4 h-8 w-24 animate-pulse rounded bg-roast/10" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-lg bg-roast/10"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
