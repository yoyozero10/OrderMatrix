"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-xl2 border border-slate/20 bg-cloud p-4 shadow-soft">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate">
        Control Panel
      </p>
      <nav className="space-y-1.5">
        {adminNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-[#1f2a37] text-white shadow-soft"
                  : "text-ink hover:bg-[#1f2a37] hover:text-white hover:shadow-soft"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
