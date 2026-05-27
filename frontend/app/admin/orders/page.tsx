"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/order/status-pill";
import { adminApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/api/client";
import type { AdminOrderSummary, OrderStatus, PaginationMeta } from "@/lib/api/types";
import { ORDER_STATUS_OPTIONS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function AdminOrdersPage() {
  const auth = useRequireAuth({ adminOnly: true });
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async (page = 1) => {
    if (!auth.accessToken) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getOrders(auth.accessToken, {
        page,
        limit: 12,
        orderStatus: statusFilter || undefined,
        search: search || undefined
      });
      setOrders(response.data);
      setMeta(response.meta);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load admin orders"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.accessToken) {
      return;
    }
    void fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.accessToken, statusFilter]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!auth.accessToken) {
      return;
    }
    setUpdatingId(orderId);
    setError(null);
    try {
      await adminApi.updateOrderStatus(auth.accessToken, orderId, status);
      await fetchOrders(meta?.page || 1);
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Could not update order status"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Admin"
        title="Orders Management"
        description="Search and update order lifecycle state transitions."
      />

      <Card className="flex flex-col gap-2 md:flex-row">
        <Input
          placeholder="Search by code or customer..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="w-full md:w-56">
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "")}
          >
            <option value="">All statuses</option>
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="ghost" onClick={() => void fetchOrders(1)}>
          Apply
        </Button>
      </Card>

      {error ? <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card> : null}

      <Card className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-slate">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate">No orders found.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-3 rounded-xl border border-slate/20 bg-cloud p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="space-y-1">
                <Link href={`/admin/orders/${order.id}`} className="text-sm font-bold text-ink underline">
                  {order.orderCode}
                </Link>
                <p className="text-xs text-slate">
                  {order.customer?.fullName ?? "Unknown customer"} |{" "}
                  {order.customer?.email ?? "No email"}
                </p>
                <p className="text-xs text-slate">{formatDate(order.createdAt)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={order.orderStatus} />
                <p className="font-semibold text-ink">{formatCurrency(order.totalAmount)}</p>
                <Select
                  className="w-40"
                  defaultValue={order.orderStatus}
                  onChange={(event) =>
                    void updateOrderStatus(order.id, event.target.value as OrderStatus)
                  }
                  disabled={updatingId === order.id}
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ))
        )}
      </Card>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-xl2 border border-slate/20 bg-cloud p-3">
          <Button
            variant="ghost"
            disabled={meta.page <= 1}
            onClick={() => void fetchOrders(meta.page - 1)}
          >
            Previous
          </Button>
          <p className="text-sm font-semibold text-slate">
            Page {meta.page} / {meta.totalPages}
          </p>
          <Button
            variant="ghost"
            disabled={meta.page >= meta.totalPages}
            onClick={() => void fetchOrders(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
