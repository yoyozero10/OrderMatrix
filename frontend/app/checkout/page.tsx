"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SectionHeading } from "@/components/ui/section-heading";
import { cartApi, orderApi } from "@/lib/api/services";
import type { Cart, PaymentMethod } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function CheckoutPage() {
  const router = useRouter();
  const auth = useRequireAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    city: ""
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.accessToken) {
      return;
    }

    const loadCart = async () => {
      setIsLoading(true);
      try {
        const response = await cartApi.getCart(auth.accessToken!);
        setCart(response);
        setForm((prev) => ({
          ...prev,
          fullName: auth.user?.fullName ?? prev.fullName,
          phone: auth.user?.phone ?? prev.phone
        }));
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Could not load checkout info"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadCart();
  }, [auth.accessToken, auth.isAuthenticated, auth.user?.fullName, auth.user?.phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.accessToken) {
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await orderApi.create(auth.accessToken, {
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          ward: form.ward || undefined,
          district: form.district || undefined,
          city: form.city
        },
        paymentMethod
      });
      router.push(`/orders/${created.id}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Could not place order"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auth.isReady || isLoading) {
    return <Card className="py-14 text-center text-sm text-slate">Loading checkout...</Card>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Card className="space-y-3 py-14 text-center">
        <p className="text-sm text-slate">Your cart is empty.</p>
        <Button onClick={() => router.push("/")}>Back to catalog</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Checkout"
        title="Shipping and payment"
        description="Order is created from current cart and validated with backend stock rules."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Full name</label>
              <Input
                required
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Phone</label>
              <Input
                required
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">City</label>
              <Input
                required
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Address</label>
              <Input
                required
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Ward</label>
              <Input
                value={form.ward}
                onChange={(event) => setForm((prev) => ({ ...prev, ward: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">District</label>
              <Input
                value={form.district}
                onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Payment method</label>
              <Select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {error ? <p className="sm:col-span-2 text-sm font-semibold text-rose-700">{error}</p> : null}

            <Button type="submit" className="sm:col-span-2" loading={isSubmitting}>
              Place order
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">Order Summary</p>
          <div className="space-y-2 text-sm">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{item.product.name}</p>
                  <p className="text-xs text-slate">
                    {item.quantity} x {formatCurrency(item.product.price)}
                  </p>
                </div>
                <p className="font-semibold text-ink">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate/20 pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate">Total</span>
              <span className="text-lg font-black text-ink">{formatCurrency(cart.totalAmount)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
