import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";

import { getCafeBySlug } from "@/lib/queries/cafes";
import { QuickContactBar } from "@/components/cafes/QuickContactBar";
import { PhotoGallery } from "@/components/cafes/PhotoGallery";
import { MenuHighlights } from "@/components/cafes/MenuHighlights";
import { CafeUpcomingEvents } from "@/components/cafes/CafeUpcomingEvents";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cafe = await getCafeBySlug(slug);

  if (!cafe) return { title: "Cafe Not Found | GoOut Hyd" };

  return {
    title: `${cafe.name} — ${cafe.area} | GoOut Hyd`,
    description:
      cafe.description?.slice(0, 160) ??
      `Visit ${cafe.name} in ${cafe.area}, Hyderabad`,
    openGraph: {
      images: cafe.coverImage ? [{ url: cafe.coverImage }] : [],
    },
  };
}

export default async function CafeProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const cafe = await getCafeBySlug(slug);

  if (!cafe) notFound();

  return (
    <div>
      {/* Hero — full-width cover image with name + area overlay */}
      <div className="relative h-72 w-full overflow-hidden sm:h-96">
        {cafe.coverImage ? (
          <Image
            src={cafe.coverImage}
            alt={`${cafe.name} cover photo`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0a0a0a]/10 to-[#fbf497]/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 sm:p-10">
          <h1 className="line-clamp-2 text-4xl font-medium text-[#f8f7f2] sm:text-5xl">
            {cafe.name}
          </h1>
          <span className="mt-3 inline-block rounded-full border border-foam/40 px-3 py-1 text-sm text-foam/80">
            {cafe.area}
          </span>
        </div>
      </div>

      {/* Page body — constrained width */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Contact Bar */}
        <QuickContactBar cafe={cafe} />

        {/* Content sections */}
        <div className="space-y-14 py-12">
          {/* About */}
          {cafe.description && (
            <section>
              <h2 className="mb-4 text-3xl font-medium text-foreground">About</h2>
              <p className="leading-relaxed text-muted-foreground">{cafe.description}</p>
            </section>
          )}

          {/* Upcoming Events */}
          {cafe.upcomingEvents.length > 0 && (
            <CafeUpcomingEvents events={cafe.upcomingEvents} />
          )}

          {/* Menu */}
          {cafe.menuItems.length > 0 && <MenuHighlights items={cafe.menuItems} />}

          {/* Gallery */}
          {cafe.images.length > 0 && (
            <PhotoGallery images={cafe.images} cafeName={cafe.name} />
          )}
        </div>
      </div>
    </div>
  );
}
