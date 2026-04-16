import Link from "next/link";
import { Instagram } from "lucide-react";
import { Logo } from "@/components/Logo";

const EXPLORE_LINKS = [
  { href: "/cafes", label: "Cafes" },
  { href: "/events", label: "Events" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/partner", label: "Partner with Us" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

function FooterLinkGroup({
  heading,
  links,
}: {
  heading: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-cream/40">
        {heading}
      </p>
      <nav className="flex flex-col gap-2">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-sm text-cream/70 transition-colors hover:text-cream"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="w-full bg-espresso">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 4-column grid: brand, explore, company, legal */}
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 — brand */}
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
            <Logo className="text-cream text-xl" />
            <p className="max-w-xs text-sm leading-relaxed text-cream/60">
              Discover independent cafes and unforgettable events in Hyderabad.
            </p>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GoOut Hyd on Instagram"
              className="mt-1 inline-flex items-center gap-2 text-sm text-cream/70 transition-colors hover:text-caramel"
            >
              <Instagram className="h-4 w-4" strokeWidth={2} />
              Instagram
            </Link>
          </div>

          {/* Col 2 — explore */}
          <FooterLinkGroup heading="Explore" links={EXPLORE_LINKS} />

          {/* Col 3 — company */}
          <FooterLinkGroup heading="Company" links={COMPANY_LINKS} />

          {/* Col 4 — legal */}
          <FooterLinkGroup heading="Legal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-cream/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-cream/30">
            © {new Date().getFullYear()} GoOut Hyd. All rights reserved.
          </p>
          <p className="text-xs text-cream/30">Made with love in Hyderabad</p>
        </div>
      </div>
    </footer>
  );
}
