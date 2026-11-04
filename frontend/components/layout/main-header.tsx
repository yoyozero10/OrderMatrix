"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { cartApi } from "@/lib/api/services";

export function MainHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (auth.isAuthenticated && auth.accessToken) {
      cartApi.getCart(auth.accessToken)
        .then((cart) => {
          const count = cart.items?.reduce((s, i) => s + (i.quantity || 1), 0) ?? 0;
          setCartCount(count);
        })
        .catch(() => setCartCount(0));
    }
  }, [auth.isAuthenticated, auth.accessToken, pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.08] bg-[#f5f5f7]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition active:scale-[0.98]">
          <svg className="h-5 w-5 text-[#1d1d1f]" viewBox="0 0 170 170" fill="currentColor" aria-hidden="true">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.61-11.1-20.2-14.41-31.78-3.3-11.58-4.96-22.61-4.96-33.1 0-14.62 3.66-26.68 10.98-36.19 7.32-9.5 16.48-14.37 27.48-14.6 5.02 0 10.45 1.25 16.29 3.75 5.84 2.5 9.77 3.86 11.78 4.09 1.78-.34 5.9-1.8 12.35-4.37 6.46-2.58 11.88-3.72 16.27-3.41 12.56.89 22.48 5.76 29.74 14.62-10.94 6.64-16.3 15.65-16.07 27.03.22 8.94 3.69 16.42 10.41 22.44 6.72 6.03 14.75 9.61 24.1 10.74-2.12 6.65-4.63 13.2-7.53 19.64zM119.22 31.84c0-7.36 2.65-14.15 7.96-20.37 5.3-6.22 11.83-10.05 19.57-11.47.67 7.25-1.89 14.18-7.68 20.78-5.79 6.61-12.4 10.3-19.85 11.06z"/>
          </svg>
          <span className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">OrderMatrix</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
              pathname === "/"
                ? "bg-white text-[#1d1d1f] shadow-sm"
                : "text-[#6e6e73] hover:text-[#1d1d1f]"
            )}
          >
            Sản phẩm
          </Link>
          <Link
            href="/canvas"
            className={cn(
              "group relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
              pathname.startsWith("/canvas")
                ? "bg-white text-[#1d1d1f] shadow-sm"
                : "text-[#6e6e73] hover:text-[#1d1d1f]"
            )}
          >
            <span>Setup Canvas</span>
            <span className="rounded-full bg-[#0071e3]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0071e3] transition group-hover:bg-[#0071e3] group-hover:text-white">
              Mới
            </span>
          </Link>
          <Link
            href="/orders"
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
              pathname.startsWith("/orders")
                ? "bg-white text-[#1d1d1f] shadow-sm"
                : "text-[#6e6e73] hover:text-[#1d1d1f]"
            )}
          >
            Lịch sử đơn
          </Link>
          {auth.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
                pathname.startsWith("/admin")
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              )}
            >
              Quản trị
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link href="/cart">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 text-[13px]"
              aria-label="Túi hàng"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>Túi hàng</span>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1d1d1f] px-1 text-[11px] font-semibold text-white">
                {cartCount}
              </span>
            </Button>
          </Link>

          {!auth.isReady ? null : auth.isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="secondary" size="sm" className="gap-2 text-[13px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20a8 8 0 0 1 16 0"/>
                  </svg>
                  <span>{auth.user?.fullName?.split(" ")[0] || "Tài khoản"}</span>
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-[#86868b] hover:text-[#ff3b30]"
                onClick={async () => {
                  await auth.logout();
                  router.push("/login");
                }}
              >
                Đăng xuất
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => router.push("/login")} className="gap-1.5 text-[13px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20a8 8 0 0 1 16 0"/>
              </svg>
              <span>Đăng nhập</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
