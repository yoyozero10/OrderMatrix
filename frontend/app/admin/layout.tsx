"use client";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Card } from "@/components/ui/card";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const auth = useRequireAuth({ adminOnly: true });

  if (!auth.isReady) {
    return <Card className="py-14 text-center text-sm text-slate">Loading admin area...</Card>;
  }

  if (!auth.isAuthenticated || !auth.isAdmin) {
    return null;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <AdminSidebar />
      <div className="space-y-5">{children}</div>
    </div>
  );
}
