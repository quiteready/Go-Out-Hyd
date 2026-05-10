import { DM_Serif_Display, DM_Sans, Noto_Sans_Telugu } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ScrollReveal } from "@/components/ScrollReveal";
import "./globals.css";

export { metadata } from "@/lib/metadata";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  // Renamed: --font-heading → --font-display
  // Tailwind: use font-display in ≤2 places (wink band + philosophy heading only)
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const notoSansTelugu = Noto_Sans_Telugu({
  weight: ["300", "500"],
  variable: "--font-telugu",
  subsets: ["telugu"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} ${dmSans.variable} ${notoSansTelugu.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <ScrollReveal />
        <Toaster />
      </body>
    </html>
  );
}
