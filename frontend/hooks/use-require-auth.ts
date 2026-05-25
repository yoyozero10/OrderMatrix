"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

type Options = {
  adminOnly?: boolean;
  redirectTo?: string;
};

export function useRequireAuth(options: Options = {}) {
  const { adminOnly = false, redirectTo = "/login" } = options;
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }

    if (!auth.isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (adminOnly && !auth.isAdmin) {
      router.replace("/");
    }
  }, [adminOnly, auth.isAdmin, auth.isAuthenticated, auth.isReady, redirectTo, router]);

  return auth;
}
