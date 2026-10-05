"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Tổng quan (Stats)" },
  { href: "/admin/products", label: "Sản phẩm & SKU" },
  { href: "/admin/orders", label: "Quản lý đơn hàng" },
  { href: "/admin/coupons", label: "Mã giảm giá (Vouchers)" },
  { href: "/admin/categories", label: "Danh mục" },
  { href: "/admin/users", label: "Người dùng" }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-[18px] border border-black/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)]">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
        Bảng điều khiển
      </p>
      <nav className="space-y-1">
        {adminNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-full px-3.5 py-2 text-xs font-semibold transition active:scale-95",
                isActive
                  ? "bg-[#0071e3] text-white shadow-sm"
                  : "text-[#6e6e73] hover:bg-black/[0.03] hover:text-[#1d1d1f]"
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
