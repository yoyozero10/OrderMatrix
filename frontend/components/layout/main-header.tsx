"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const navItems = [
  { href: "/", label: "Catalog" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/profile", label: "Profile" }
];

const THEME_STORAGE_KEY = "order-app-theme";

type ThemeMode = "light" | "dark";

function getInitials(nameOrEmail?: string) {
  if (!nameOrEmail) {
    return "U";
  }

  const words = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return nameOrEmail.slice(0, 2).toUpperCase();
}

export function MainHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const displayName = auth.user?.fullName || auth.user?.email;
  const avatarUrl = auth.user?.avatar?.trim();

  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      document.documentElement.classList.toggle("dark", mode === "dark");
    };

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: ThemeMode =
      storedTheme === "dark" || (storedTheme !== "light" && prefersDarkMode)
        ? "dark"
        : "light";

    setTheme(nextTheme);
    applyTheme(nextTheme);
    setIsThemeReady(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate/15 bg-cloud/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f2a37] text-sm font-black text-white transition group-hover:rotate-6">
            OM
          </span>
          <div>
            <p className="font-heading text-lg font-bold text-ink">OrderMatrix</p>
            <p className="text-xs uppercase tracking-[0.16em] text-slate">Commerce Control</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                pathname === item.href
                  ? "bg-[#1f2a37] text-white shadow-soft"
                  : "text-ink hover:bg-[#1f2a37] hover:text-white hover:shadow-soft"
              )}
            >
              {item.label}
            </Link>
          ))}
          {auth.isAdmin ? (
            <Link
              href="/admin"
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                pathname?.startsWith("/admin")
                  ? "bg-[#1f2a37] text-white shadow-soft"
                  : "text-ink hover:bg-[#1f2a37] hover:text-white hover:shadow-soft"
              )}
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="ghost"
            disabled={!isThemeReady}
            className="min-w-[105px] hover:bg-[#1f2a37] hover:text-white hover:border-transparent hover:shadow-soft"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
          {!auth.isReady ? null : auth.isAuthenticated ? (
            <>
              <div className="h-9 w-9 overflow-hidden rounded-full border border-slate/20 bg-mist">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName ?? "User avatar"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-ink">
                    {getInitials(displayName)}
                  </div>
                )}
              </div>
              <div className="hidden w-40 text-center sm:block">
                <p className="text-xs uppercase tracking-[0.14em] text-slate">Signed in as</p>
                <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="hover:bg-[#1f2a37] hover:text-white hover:border-transparent hover:shadow-soft"
                onClick={async () => {
                  await auth.logout();
                  router.push("/login");
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="hover:bg-[#1f2a37] hover:text-white hover:border-transparent hover:shadow-soft"
                onClick={() => router.push("/login")}
              >
                Log in
              </Button>
              <Button size="sm" onClick={() => router.push("/register")}>
                Create account
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
