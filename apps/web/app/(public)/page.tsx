import type { Metadata } from "next";
import { env } from "@/lib/env";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { PhilosophySection } from "@/components/landing/PhilosophySection";
import { WinkBand } from "@/components/landing/WinkBand";
import { DiscoverSection } from "@/components/landing/DiscoverSection";
import { AreasSection } from "@/components/landing/AreasSection";
import { PartnerCTABanner } from "@/components/landing/PartnerCTABanner";

const LANDING_TITLE = "GoOut Hyd — Everything happening in Hyderabad";
const LANDING_DESCRIPTION =
  "Your weekend starts here. Live music, comedy, workshops, open mics, and more across Hyderabad.";

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

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <PhilosophySection />
      <WinkBand />
      <DiscoverSection />
      <AreasSection />
      <PartnerCTABanner />
    </>
  );
}
