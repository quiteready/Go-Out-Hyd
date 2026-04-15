"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/cafes", label: "Cafes" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-espresso">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link href="/" aria-label="GoOut Hyd home">
          <Logo className="text-cream text-xl" />
        </Link>

        {/* Center tagline — hidden on mobile */}
        <p className="hidden text-sm text-cream/60 md:block">
          Made with love in Hyderabad
        </p>

        {/* Desktop right — nav links + CTA */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-caramel font-medium"
                  : "text-cream/80 hover:text-cream",
              )}
            >
              {label}
            </Link>
          ))}
          <Button
            asChild
            className="bg-caramel text-espresso font-medium hover:bg-gold"
          >
            <Link href="/partner">Partner with Us</Link>
          </Button>
        </div>

        {/* Mobile — hamburger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="text-cream hover:bg-espresso/80 hover:text-cream"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-espresso border-roast w-72">
              <div className="mt-6 flex flex-col gap-6">
                <Link href="/" aria-label="GoOut Hyd home">
                  <Logo className="text-cream text-lg" />
                </Link>
                <nav className="flex flex-col gap-4">
                  {NAV_LINKS.map(({ href, label }) => (
                    <SheetClose asChild key={href}>
                      <Link
                        href={href}
                        className={cn(
                          "text-base transition-colors",
                          pathname === href || pathname.startsWith(href + "/")
                            ? "text-caramel font-medium"
                            : "text-cream/80 hover:text-cream",
                        )}
                      >
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <SheetClose asChild>
                  <Button
                    asChild
                    className="bg-caramel text-espresso font-medium hover:bg-gold w-full"
                  >
                    <Link href="/partner">Partner with Us</Link>
                  </Button>
                </SheetClose>
                <p className="text-xs text-cream/40">
                  Made with love in Hyderabad
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
