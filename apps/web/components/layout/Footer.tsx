import Link from "next/link";
import { Instagram } from "lucide-react";
import { Logo } from "@/components/Logo";

const QUICK_LINKS = [
  { href: "/cafes", label: "Cafes" },
  { href: "/events", label: "Events" },
  { href: "/partner", label: "Partner with Us" },
] as const;

export function Footer() {
  return (
    <footer className="w-full bg-espresso">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Left — brand */}
          <div className="flex flex-col gap-3">
            <Logo className="text-cream text-xl" />
            <p className="text-sm text-cream/60 leading-relaxed">
              Built for Hyderabadis
            </p>
          </div>

          {/* Center — quick links */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-cream/40">
              Explore
            </p>
            <nav className="flex flex-col gap-2">
              {QUICK_LINKS.map(({ href, label }) => (
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

          {/* Right — social + credit */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-cream/40">
              Follow Us
            </p>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GoOut Hyd on Instagram"
              className="flex items-center gap-2 text-sm text-cream/70 transition-colors hover:text-caramel"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-cream/10 pt-6">
          <p className="text-xs text-cream/30">
            © {new Date().getFullYear()} GoOut Hyd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
