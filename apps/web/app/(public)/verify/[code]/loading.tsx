export default function VerifyLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="animate-pulse rounded-lg border border-sand bg-card p-6 shadow-sm">
        <div className="mx-auto h-6 w-32 rounded-full bg-sand" />
        <div className="mx-auto mt-4 h-8 w-3/4 rounded bg-sand" />
        <div className="mt-6 space-y-3 border-t border-sand pt-6">
          <div className="h-4 w-full rounded bg-sand" />
          <div className="h-4 w-5/6 rounded bg-sand" />
          <div className="h-4 w-2/3 rounded bg-sand" />
          <div className="h-4 w-3/4 rounded bg-sand" />
        </div>
      </div>
    </div>
  );
}
