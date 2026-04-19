"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Coffee,
  CalendarDays,
  Ticket,
  Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/cafes", label: "Cafes", icon: Coffee },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
];

function pageTitleFromPath(pathname: string): string {
  if (pathname === "/admin") return "Overview";
  const segments = pathname.replace(/^\/admin\/?/, "").split("/");
  const first = segments[0];
  const map: Record<string, string> = {
    cafes: "Cafes",
    events: "Events",
    tickets: "Tickets",
    leads: "Leads",
  };
  return map[first] ?? "Admin";
}

export function AdminHeader() {
  const pathname = usePathname();
  const title = pageTitleFromPath(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b border-neutral-200 p-4">
              <SheetTitle className="text-left text-sm font-semibold">
                GoOut Admin
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-0.5 p-3">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <h1 className="text-base font-semibold text-neutral-900">{title}</h1>
      </div>

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900"
      >
        View public site
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </header>
  );
}
