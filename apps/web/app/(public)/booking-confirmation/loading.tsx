import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="rounded-lg border border-sand bg-foam p-6 shadow-sm sm:p-10">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="mt-6 h-60 w-60" />
          <div className="mt-6 w-full space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
