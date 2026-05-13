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
  { href: "/cafes", label: "Cafes", matchPath: "/cafes" },
  { href: "/events", label: "Events", matchPath: "/events" },
  { href: "/about", label: "About", matchPath: "/about" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-black">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link href="/" aria-label="GoOut Hyd home">
          <Logo className="text-white text-xl" />
        </Link>

        {/* Desktop right — nav links + CTA */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ href, label, matchPath }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm transition-colors",
                pathname === matchPath || pathname.startsWith(matchPath + "/")
                  ? "text-yellow font-medium border-b-2 border-yellow pb-0.5"
                  : "text-white/70 font-light hover:text-white",
              )}
            >
              {label}
            </Link>
          ))}
          <Button
            asChild
            className="bg-yellow text-black font-medium hover:opacity-85 hover:bg-yellow"
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
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black border-white/10 w-72">
              <div className="mt-6 flex flex-col gap-6">
                <Link href="/" aria-label="GoOut Hyd home" className="flex items-center">
                  <Logo className="text-white text-lg" />
                  <span className="ml-2 text-[10px] tracking-[0.4em] text-yellow/60">హైదరాబాద్</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {NAV_LINKS.map(({ href, label, matchPath }) => (
                    <SheetClose asChild key={href}>
                      <Link
                        href={href}
                        className={cn(
                          "text-base transition-colors",
                          pathname === matchPath ||
                            pathname.startsWith(matchPath + "/")
                            ? "text-yellow font-medium"
                            : "text-white/70 font-light hover:text-white",
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
                    className="bg-yellow text-black font-medium hover:opacity-85 hover:bg-yellow w-full"
                  >
                    <Link href="/partner">Partner with Us</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
