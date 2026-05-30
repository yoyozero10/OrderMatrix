"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/order/status-pill";
import { getErrorMessage } from "@/lib/api/client";
import { orderApi } from "@/lib/api/services";
import type { OrderStatus, OrderSummary, PaginationMeta } from "@/lib/api/types";
import { ORDER_STATUS_OPTIONS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function OrdersPage() {
  const auth = useRequireAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (page = 1, filter = status) => {
    if (!auth.accessToken) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await orderApi.getMine(auth.accessToken, {
        page,
        limit: 10,
        orderStatus: filter || undefined
      });
      setOrders(response.data);
      setMeta(response.meta);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load orders"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated) {
      return;
    }
    void fetchOrders(1, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.accessToken, status]);

  const handleCancel = async (orderId: string) => {
    if (!auth.accessToken) {
      return;
    }
    try {
      await orderApi.cancel(auth.accessToken, orderId);
      await fetchOrders(meta?.page || 1, status);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError, "Could not cancel order"));
    }
  };

  if (!auth.isReady || isLoading) {
    return <Card className="py-14 text-center text-sm text-slate">Loading orders...</Card>;
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Account"
        title="My Orders"
        description="Track order status and open detailed snapshots."
        rightSlot={
          <div className="w-full sm:w-60">
            <Select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "")}>
              <option value="">All statuses</option>
              {ORDER_STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {error ? <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card> : null}

      {orders.length === 0 ? (
        <Card className="py-14 text-center text-sm text-slate">No orders found.</Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">{order.orderCode}</p>
                <p className="font-semibold text-ink">{formatCurrency(order.totalAmount)}</p>
                <p className="text-sm text-slate">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={order.orderStatus} />
                <Link href={`/orders/${order.id}`}>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </Link>
                {order.orderStatus === "pending" ? (
                  <Button size="sm" variant="danger" onClick={() => void handleCancel(order.id)}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-xl2 border border-slate/20 bg-cloud p-3">
          <Button
            variant="ghost"
            disabled={meta.page <= 1}
            onClick={() => void fetchOrders(meta.page - 1, status)}
          >
            Previous
          </Button>
          <p className="text-sm font-semibold text-slate">
            Page {meta.page} / {meta.totalPages}
          </p>
          <Button
            variant="ghost"
            disabled={meta.page >= meta.totalPages}
            onClick={() => void fetchOrders(meta.page + 1, status)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
