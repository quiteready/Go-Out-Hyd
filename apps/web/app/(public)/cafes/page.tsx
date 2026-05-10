import { Suspense } from "react";
import { getAllCafes } from "@/lib/queries/cafes";
import { AREAS, CAFES_AREA_SEARCH_PARAM } from "@/lib/constants/areas";
import { CafeCard } from "@/components/cafes/CafeCard";
import { AreaFilterPills } from "@/components/cafes/AreaFilterPills";
import { CafeEmptyState } from "@/components/cafes/CafeEmptyState";
import { PageHero } from "@/components/layout/PageHero";
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
    <>
      <PageHero
        eyebrow="CAFES"
        title={activeAreaName ? `Cafes in ${activeAreaName}` : "All cafes"}
        lead="Explore independent cafes across Hyderabad"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
          <CafeEmptyState area={activeAreaName} />
        )}
      </div>
    </>
  );
}
