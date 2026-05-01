import { Suspense } from "react";
import { getAllCafes } from "@/lib/queries/cafes";
import { AREAS, CAFES_AREA_SEARCH_PARAM } from "@/lib/constants/areas";
import { CafeCard } from "@/components/cafes/CafeCard";
import { AreaFilterPills } from "@/components/cafes/AreaFilterPills";
import { Coffee } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cafes — GoOut Hyd",
  description:
    "Browse the best cafes in Hyderabad. Filter by area and discover your next favourite spot.",
};

interface CafesPageProps {
  searchParams: Promise<Partial<Record<typeof CAFES_AREA_SEARCH_PARAM, string>>>;
}

export default async function CafesPage({ searchParams }: CafesPageProps) {
  const resolved = await searchParams;
  const area = resolved[CAFES_AREA_SEARCH_PARAM];

  // Validate area slug — ignore unknown values
  const areaSlug =
    area && AREAS.some((a) => a.slug === area) ? area : undefined;

  const cafes = await getAllCafes(areaSlug);

  const activeAreaName = areaSlug
    ? AREAS.find((a) => a.slug === areaSlug)?.name
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-medium text-foreground">
          {activeAreaName ? `Cafes in ${activeAreaName}` : "All Cafes"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {activeAreaName
            ? `Showing cafes in ${activeAreaName}`
            : "Explore cafes across Hyderabad"}
        </p>
      </div>

      {/* Area filter pills — wrapped in Suspense because AreaFilterPills reads useSearchParams */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-9" />}>
          <AreaFilterPills />
        </Suspense>
      </div>

      {/* Cafe grid or empty state */}
      {cafes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cafes.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </div>
      ) : (
        <EmptyState area={activeAreaName} />
      )}
    </div>
  );
}

function EmptyState({ area }: { area?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/8">
        <Coffee className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-medium text-foreground">
        {area ? `No cafes in ${area} yet` : "No cafes yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {area
          ? `We haven't listed any cafes in ${area} yet. Try another area or check back soon.`
          : "We're working on adding cafes. Check back soon."}
      </p>
    </div>
  );
}
