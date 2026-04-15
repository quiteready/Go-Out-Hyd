import type { ReactElement } from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { BrowseByArea } from "@/components/landing/BrowseByArea";
import { FeaturedCafes } from "@/components/landing/FeaturedCafes";
import { UpcomingEventsSection } from "@/components/landing/UpcomingEventsSection";
import { PartnerCTABanner } from "@/components/landing/PartnerCTABanner";
import { getFeaturedCafes } from "@/lib/queries/cafes";
import { getUpcomingEventsForLanding } from "@/lib/queries/events";
import { env } from "@/lib/env";

const LANDING_TITLE = "GoOut Hyd -- Discover Hyderabad's Best Cafes & Events";
const LANDING_DESCRIPTION =
  "Your weekend starts here. Browse independent cafes, discover live music nights, open mics, workshops, and more across Hyderabad.";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  return {
    title: { absolute: LANDING_TITLE },
    description: LANDING_DESCRIPTION,
    openGraph: {
      title: LANDING_TITLE,
      description: LANDING_DESCRIPTION,
      url: siteUrl,
      siteName: "GoOut Hyd",
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: LANDING_TITLE,
      description: LANDING_DESCRIPTION,
    },
  };
}

export default async function HomePage(): Promise<ReactElement> {
  const [cafes, events] = await Promise.all([
    getFeaturedCafes(6),
    getUpcomingEventsForLanding(4),
  ]);

  return (
    <>
      <HeroSection />
      <BrowseByArea />
      <FeaturedCafes cafes={cafes} />
      <UpcomingEventsSection events={events} />
      <PartnerCTABanner />
    </>
  );
}
