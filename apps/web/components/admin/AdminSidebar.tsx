"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coffee,
  CalendarDays,
  Ticket,
  Inbox,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adminLogout } from "@/app/actions/admin/auth";
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
  { href: "/admin/event-leads", label: "Event Leads", icon: Megaphone },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 lg:flex">
      <div className="flex h-14 items-center border-b border-neutral-200 px-5">
        <Link
          href="/admin"
          className="text-sm font-semibold tracking-tight text-neutral-900"
        >
          GoOut Admin
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-200/70 hover:text-neutral-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <form action={adminLogout}>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
