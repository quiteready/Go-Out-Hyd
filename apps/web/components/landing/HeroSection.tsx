import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const HERO_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=500&fit=crop",
    alt: "Cosy cafe interior",
  },
  {
    src: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=500&fit=crop",
    alt: "Live music night at a cafe",
  },
  {
    src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=500&fit=crop",
    alt: "Specialty coffee art",
  },
  {
    src: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400&h=500&fit=crop",
    alt: "Workshop at a cafe",
  },
] as const;

export function HeroSection(): ReactElement {
  return (
    <section className="w-full bg-cream">
      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pt-20 lg:pb-12">
        {/* Left column — content */}
        <div className="flex flex-col items-start">
          {/* Badge pill */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-caramel/10 px-3.5 py-1.5">
            <Coffee className="h-3.5 w-3.5 text-caramel" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-caramel">
              Hyderabad&apos;s Independent Cafe Scene
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl leading-tight text-espresso sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Discover the Best Cafes &amp; Events in Hyderabad
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-lg text-base text-roast/80 sm:text-lg">
            Explore independent cafes, attend live music nights, open mics,
            workshops, and more — all in one place.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/cafes"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-caramel px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
            >
              Explore Cafes
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-caramel bg-transparent px-6 py-2.5 text-sm font-medium text-caramel transition-colors hover:bg-caramel/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
            >
              Browse Events
            </Link>
          </div>

        </div>

        {/* Right column — staggered 2×2 photo grid, desktop only */}
        <div className="mt-12 hidden lg:mt-0 lg:block">
          <div className="grid grid-cols-2 gap-4">
            {HERO_PHOTOS.map((photo, index) => (
              <div
                key={photo.src}
                className={cn(
                  "relative h-56 overflow-hidden rounded-2xl",
                  index % 2 === 1 && "mt-8",
                )}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 20vw, 0px"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
