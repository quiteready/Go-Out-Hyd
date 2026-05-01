export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-10 w-36 animate-pulse rounded bg-foreground/8" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-foreground/8" />
      </div>

      {/* Category filter skeleton */}
      <div className="mb-8 flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-16 w-28 shrink-0 animate-pulse rounded-xl bg-foreground/8"
          />
        ))}
      </div>

      {/* Event card grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="h-48 w-full animate-pulse bg-foreground/8" />
            <div className="p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-foreground/8" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-foreground/8" />
              <div className="mt-3 flex items-center justify-between">
                <div className="h-5 w-20 animate-pulse rounded-full bg-foreground/8" />
                <div className="h-4 w-16 animate-pulse rounded bg-foreground/8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
