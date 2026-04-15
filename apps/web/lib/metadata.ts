import type { Metadata } from "next";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    template: "%s | GoOut Hyd",
    default: "GoOut Hyd — Discover Hyderabad's Best Cafes & Events",
  },
  description:
    "Discover Hyderabad's best independent cafes and upcoming events. Browse by area, explore menus, and find your next favourite spot.",
  keywords: [
    "Hyderabad cafes",
    "cafes in Hyderabad",
    "events in Hyderabad",
    "Banjara Hills cafes",
    "Jubilee Hills cafes",
    "Kondapur cafes",
    "GoOut Hyd",
    "cafe discovery",
    "Hyderabad events",
  ],
  openGraph: {
    title: "GoOut Hyd — Discover Hyderabad's Best Cafes & Events",
    description:
      "Discover Hyderabad's best independent cafes and upcoming events. Browse by area, explore menus, and find your next favourite spot.",
    url: new URL(defaultUrl),
    siteName: "GoOut Hyd",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoOut Hyd — Discover Hyderabad's Best Cafes & Events",
    description:
      "Discover Hyderabad's best independent cafes and upcoming events.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export const generateLegalMetadata = (
  title: string,
  description: string,
): Metadata => {
  return {
    title: `${title} | GoOut Hyd`,
    description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${title} | GoOut Hyd`,
      description,
      type: "website",
    },
  };
};
