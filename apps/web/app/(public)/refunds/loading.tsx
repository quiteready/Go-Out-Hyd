export default function RefundsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-background to-muted/20 border-b">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 h-10 animate-pulse rounded-lg bg-muted/30" />
            <div className="mb-2 h-6 animate-pulse rounded-lg bg-muted/20" />
            <div className="mb-6 h-6 w-3/4 animate-pulse rounded-lg bg-muted/20" />
            <div className="h-4 w-48 animate-pulse rounded-lg bg-muted/20" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 w-1/3 animate-pulse rounded-lg bg-muted/30" />
                <div className="space-y-2">
                  <div className="h-4 animate-pulse rounded-lg bg-muted/20" />
                  <div className="h-4 w-5/6 animate-pulse rounded-lg bg-muted/20" />
                  <div className="h-4 w-4/5 animate-pulse rounded-lg bg-muted/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
