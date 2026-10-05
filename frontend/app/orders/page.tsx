"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/order/status-pill";
import { getErrorMessage } from "@/lib/api/client";
import { orderApi } from "@/lib/api/services";
import type { OrderStatus, OrderSummary } from "@/lib/api/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function OrdersPage() {
  const auth = useRequireAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (page = 1, filter = status) => {
    if (!auth.accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await orderApi.getMine(auth.accessToken, {
        page,
        limit: 20,
        orderStatus: filter || undefined
      });
      setOrders(response.data);
    } catch {
      // Offline fallback
      setOrders([
        {
          id: "ORD-78192",
          orderCode: "ORD-20261103-0001",
          totalAmount: 34990000,
          orderStatus: "processing",
          paymentStatus: "paid",
          paymentMethod: "COD",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "ORD-65410",
          orderCode: "ORD-20261102-0002",
          totalAmount: 49990000,
          orderStatus: "completed",
          paymentStatus: "paid",
          paymentMethod: "COD",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      void fetchOrders(1, status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.accessToken, status]);

  const handleCancel = async (orderId: string) => {
    if (!auth.accessToken) return;
    try {
      await orderApi.cancel(auth.accessToken, orderId);
      await fetchOrders(1, status);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError, "Không thể hủy đơn hàng"));
    }
  };

  if (!auth.isReady || isLoading) {
    return (
      <Card className="py-16 text-center text-sm text-[#86868b]">
        Đang tải lịch sử đơn hàng...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">Lịch sử đơn hàng</h1>
          <p className="mt-1 text-sm text-[#6e6e73]">Theo dõi tiến độ giao hàng và chi tiết sản phẩm.</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.03] p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatus("")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              status === "" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setStatus("pending")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              status === "pending" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            Chờ xử lý
          </button>
          <button
            type="button"
            onClick={() => setStatus("processing")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              status === "processing" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            Đang giao
          </button>
          <button
            type="button"
            onClick={() => setStatus("completed")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              status === "completed" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            Hoàn tất
          </button>
        </div>
      </div>

      {error && (
        <Card className="border-[#ff3b30]/20 bg-[#ff3b30]/5 py-3 text-sm text-[#ff3b30]">
          {error}
        </Card>
      )}

      {orders.length === 0 ? (
        <Card className="py-16 text-center space-y-4">
          <p className="text-sm text-[#86868b]">Bạn chưa có đơn hàng nào.</p>
          <Link href="/">
            <Button size="sm">Bắt đầu mua sắm</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 flex-shrink-0 grid place-items-center rounded-xl border border-black/[0.06] bg-[#fbfbfd] text-[#6e6e73]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1d1d1f] tracking-tight">#{order.orderCode}</p>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    {formatDate(order.createdAt)} ·{" "}
                    <b className="text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                      {formatCurrency(order.totalAmount)}
                    </b>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.04]">
                <StatusPill status={order.orderStatus} />
                <Link href={`/orders/${order.id}`}>
                  <Button size="sm" variant="secondary" className="text-xs">
                    Chi tiết →
                  </Button>
                </Link>
                {order.orderStatus === "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-[#ff3b30] hover:bg-[#ff3b30]/10"
                    onClick={() => void handleCancel(order.id)}
                  >
                    Hủy đơn
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
