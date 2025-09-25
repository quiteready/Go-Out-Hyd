import type { Metadata } from "next";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    template: "%s | RAGI",
    default: "RAGI: Chat with Your Documents Using AI",
  },
  description:
    "Upload your documents, images, and videos, then chat with them using powerful Gemini AI models. RAGI turns your files into interactive knowledge you can query instantly.",
  keywords: [
    "RAG",
    "Document AI",
    "Chat with Documents",
    "Gemini AI",
    "Document Search",
    "AI Knowledge Base",
    "Document Analysis",
    "File Upload AI",
    "Intelligent Search",
    "Document Intelligence",
  ],
  openGraph: {
    title: "RAGI: Chat with Your Documents Using AI",
    description:
      "Upload your documents, images, and videos, then chat with them using powerful Gemini AI models. Turn your files into interactive knowledge.",
    url: new URL(defaultUrl),
    siteName: "RAGI",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "A preview of the RAGI document intelligence interface.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RAGI: Chat with Your Documents Using AI",
    description:
      "Upload your documents, images, and videos, then chat with them using powerful Gemini AI models. Turn your files into interactive knowledge.",
    images: ["/twitter-image.png"],
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
    icon: "/favicon.ico",
  },
};

export const generateLegalMetadata = (
  title: string,
  description: string,
): Metadata => {
  return {
    title: `${title} | RAGI`,
    description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${title} | RAGI`,
      description,
      type: "website",
    },
  };
};
