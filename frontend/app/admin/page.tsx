"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getErrorMessage } from "@/lib/api/client";
import { adminApi } from "@/lib/api/services";
import type { OrderStats } from "@/lib/api/types";
import { ORDER_STATUS_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function AdminDashboardPage() {
  const auth = useRequireAuth({ adminOnly: true });
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.accessToken) {
      return;
    }
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await adminApi.getOrderStats(auth.accessToken!);
        setStats(response);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Could not load dashboard stats"));
      } finally {
        setIsLoading(false);
      }
    };
    void loadStats();
  }, [auth.accessToken]);

  const maxRevenue = useMemo(() => {
    if (!stats?.revenueByMonth.length) {
      return 0;
    }
    return Math.max(...stats.revenueByMonth.map((item) => item.revenue));
  }, [stats?.revenueByMonth]);

  if (isLoading || !stats) {
    return <Card className="py-14 text-center text-sm text-slate">Loading dashboard...</Card>;
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Admin"
        title="Operations Dashboard"
        description="Revenue and order health from /admin/orders/stats."
      />

      {error ? <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard
          label="Total Orders"
          value={stats.totalOrders.toString()}
          hint="All orders created in the system"
        />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          emphasize
          hint="Revenue from completed orders"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">Orders By Status</p>
          <div className="space-y-2">
            {ORDER_STATUS_OPTIONS.map((status) => {
              const count = stats.ordersByStatus[status] ?? 0;
              return (
                <div key={status} className="flex items-center justify-between rounded-xl border border-slate/20 p-3">
                  <p className="capitalize text-slate">{status}</p>
                  <p className="font-semibold text-ink">{count}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">Revenue (6 months)</p>
          {stats.revenueByMonth.length === 0 ? (
            <p className="text-sm text-slate">No completed order revenue yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.revenueByMonth.map((point) => {
                const ratio = maxRevenue ? Math.round((point.revenue / maxRevenue) * 100) : 0;
                return (
                  <div key={point.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold text-ink">{point.month}</p>
                      <p className="text-slate">{formatCurrency(point.revenue)}</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-mist">
                      <div className="h-full rounded-full bg-moss" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
