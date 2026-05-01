export default function EventDetailLoading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="h-72 w-full animate-pulse bg-foreground/8 sm:h-96" />

      {/* Body skeleton */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Info card skeleton */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-foreground/8" />
                  <div className="h-4 w-48 animate-pulse rounded bg-foreground/8" />
                </div>
              ))}
            </div>
          </div>

          {/* Description skeleton */}
          <div className="lg:col-span-2">
            <div className="mb-4 h-8 w-48 animate-pulse rounded bg-foreground/8" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-foreground/8" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-foreground/8" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-foreground/8" />
              <div className="h-4 w-full animate-pulse rounded bg-foreground/8" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/8" />
            </div>
          </div>
        </div>
      </div>

      {/* Venue section skeleton */}
      <div className="bg-secondary py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 h-8 w-24 animate-pulse rounded bg-foreground/8" />
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-foreground/8" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-foreground/8" />
              <div className="h-3 w-24 animate-pulse rounded bg-foreground/8" />
            </div>
          </div>
          <div className="mt-5 flex gap-8">
            <div className="h-4 w-28 animate-pulse rounded bg-foreground/8" />
            <div className="h-4 w-28 animate-pulse rounded bg-foreground/8" />
          </div>
          <div className="mt-6 h-4 w-40 animate-pulse rounded bg-foreground/8" />
        </div>
      </div>
    </div>
  );
}
