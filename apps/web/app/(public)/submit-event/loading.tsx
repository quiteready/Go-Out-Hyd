export default function SubmitEventLoading() {
  return (
    <div>
      <section className="bg-[#0a0a0a] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="mx-auto h-12 w-full max-w-lg animate-pulse rounded-lg bg-white/10" />
          <div className="mx-auto h-6 w-4/5 max-w-md animate-pulse rounded bg-white/10" />
        </div>
      </section>

      <section className="bg-secondary px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto h-9 w-48 animate-pulse rounded bg-foreground/8" />
          <div className="mt-10 flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-14 w-14 animate-pulse rounded-full bg-foreground/8" />
                <div className="mt-4 h-4 w-40 animate-pulse rounded bg-foreground/8" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-14 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="h-8 w-40 animate-pulse rounded bg-foreground/8" />
          <div className="h-4 w-full animate-pulse rounded bg-foreground/8" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-foreground/8" />
              <div className="h-9 w-full animate-pulse rounded bg-foreground/8" />
            </div>
          ))}
          <div className="h-10 w-full animate-pulse rounded-md bg-foreground/8" />
        </div>
      </section>
    </div>
  );
}
