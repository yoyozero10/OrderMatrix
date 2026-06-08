"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/order/status-pill";
import { getErrorMessage } from "@/lib/api/client";
import { orderApi } from "@/lib/api/services";
import type { Order } from "@/lib/api/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useRequireAuth();

  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = async () => {
    if (!auth.accessToken || !orderId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await orderApi.getById(auth.accessToken, orderId);
      setOrder(response);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load order details"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && orderId) {
      void fetchOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.accessToken, orderId]);

  const handleCancelOrder = async () => {
    if (!order || !auth.accessToken) return;

    if (!confirm("Are you sure you want to cancel this order?")) return;

    setIsCancelling(true);
    setError(null);
    try {
      await orderApi.cancel(auth.accessToken, order.id);
      void fetchOrderDetails();
    } catch (err) {
      setError(getErrorMessage(err, "Could not cancel order"));
    } finally {
      setIsCancelling(false);
    }
  };

  if (!auth.isReady || isLoading) {
    return <Card className="py-14 text-center text-sm text-slate">Loading order details...</Card>;
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <Card className="border-rose-200 bg-rose-50 py-4 text-center text-sm text-rose-700">{error}</Card>
        <Button onClick={() => router.push("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Card className="py-14 text-center text-sm text-slate">Order not found</Card>
        <Button onClick={() => router.push("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  const { shippingAddress } = order;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
          &larr; Back to My Orders
        </Button>
        {order.orderStatus === "pending" && (
          <Button
            variant="danger"
            size="sm"
            disabled={isCancelling}
            onClick={() => void handleCancelOrder()}
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card>
      )}

      <SectionHeading
        eyebrow={`Placed on ${formatDate(order.createdAt)}`}
        title={`Order Details: ${order.orderCode}`}
        description="Verify your shipping details, payment history, and items list below."
        rightSlot={
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate">Status:</span>
            <StatusPill status={order.orderStatus} />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        {/* Left Side: Order Items */}
        <Card className="p-6 space-y-4">
          <h2 className="font-heading text-lg font-black text-ink">Order Items</h2>
          <div className="divide-y divide-slate/10">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between py-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-semibold text-ink text-sm">{item.productNameSnapshot}</p>
                  <p className="text-xs text-slate">
                    {formatCurrency(item.unitPriceSnapshot)} x {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-ink text-sm">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate/15 pt-4 flex justify-between items-center">
            <span className="font-bold text-ink">Total Amount</span>
            <span className="font-heading text-xl font-black text-ink">{formatCurrency(order.totalAmount)}</span>
          </div>
        </Card>

        {/* Right Side: Shipping and Payment Info */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-heading text-lg font-black text-ink">Shipping Address</h2>
            <div className="space-y-2 text-sm text-slate">
              <p className="font-semibold text-ink">{shippingAddress.fullName}</p>
              <p>Phone: {shippingAddress.phone}</p>
              <p>
                {shippingAddress.address}, {shippingAddress.ward}, {shippingAddress.district},{" "}
                {shippingAddress.city}
              </p>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-heading text-lg font-black text-ink">Payment Information</h2>
            <div className="space-y-2 text-sm text-slate">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-semibold text-ink">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-semibold uppercase ${order.paymentStatus === "completed" ? "text-emerald-700" : "text-rose-700"}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
