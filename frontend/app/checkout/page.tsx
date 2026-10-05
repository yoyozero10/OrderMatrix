"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/client";
import { cartApi, orderApi } from "@/lib/api/services";
import type { Cart, PaymentMethod } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { value: "MOCK", label: "Thanh toán trực tuyến giả lập (MOCK)" }
];

export default function CheckoutPage() {
  const router = useRouter();
  const auth = useRequireAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    city: "Hồ Chí Minh"
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("om_applied_voucher");
      if (stored) {
        setAppliedVoucher(JSON.parse(stored));
      }
    } catch {}
  }, []);

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
        setError(getErrorMessage(loadError, "Không thể tải thông tin thanh toán"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadCart();
  }, [auth.accessToken, auth.isAuthenticated, auth.user?.fullName, auth.user?.phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.accessToken) return;

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
        paymentMethod,
        couponCode: appliedVoucher?.code || undefined
      });
      sessionStorage.removeItem("om_applied_voucher");
      router.push(`/orders/${created.id}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Không thể tạo đơn hàng"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auth.isReady || isLoading) {
    return (
      <Card className="py-16 text-center text-sm text-[#86868b]">
        Đang tải thông tin đơn hàng...
      </Card>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Card className="space-y-4 py-16 text-center">
        <p className="text-sm text-[#86868b]">Túi hàng của bạn đang trống.</p>
        <Button onClick={() => router.push("/")}>Quay lại danh mục</Button>
      </Card>
    );
  }

  const subtotal = Number(cart.totalAmount ?? 0);
  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">Thông tin đặt hàng</h1>
        <p className="mt-1 text-sm text-[#6e6e73]">Điền địa chỉ nhận hàng và chọn phương thức thanh toán.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Shipping Form */}
        <Card className="p-6">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Họ và tên người nhận</label>
              <Input
                required
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Số điện thoại</label>
              <Input
                required
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="0901234567"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Tỉnh / Thành phố</label>
              <Input
                required
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="Hồ Chí Minh"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Địa chỉ nhận hàng</label>
              <Input
                required
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="Số 123 Đường Nguyễn Huệ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Phường / Xã</label>
              <Input
                value={form.ward}
                onChange={(event) => setForm((prev) => ({ ...prev, ward: event.target.value }))}
                placeholder="Bến Nghé"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Quận / Huyện</label>
              <Input
                value={form.district}
                onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
                placeholder="Quận 1"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Phương thức thanh toán</label>
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

            {error && (
              <p className="sm:col-span-2 text-xs font-semibold text-[#ff3b30]">{error}</p>
            )}

            <Button type="submit" size="lg" className="sm:col-span-2 mt-2 w-full text-sm font-semibold" loading={isSubmitting}>
              Xác nhận đặt hàng ngay
            </Button>
          </form>
        </Card>

        {/* Order Summary */}
        <Card className="space-y-4 p-6 self-start">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">Tóm tắt đơn hàng</h2>
          <div className="space-y-3 text-xs text-[#1d1d1f] max-h-60 overflow-y-auto pr-1">
            {cart.items.map((item) => {
              const name = item.variant?.product?.name || item.product?.name || "Sản phẩm";
              const price = Number(item.variant?.price || item.product?.price || 0);

              return (
                <div key={item.id} className="flex items-start justify-between gap-3 border-b border-black/[0.04] pb-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{name}</p>
                    <p className="text-[11px] text-[#86868b]">
                      {item.quantity} x {formatCurrency(price)}
                    </p>
                  </div>
                  <p className="font-bold [font-variant-numeric:tabular-nums]">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-black/[0.06] pt-3 space-y-2 text-xs text-[#6e6e73]">
            <div className="flex items-center justify-between">
              <span>Tạm tính:</span>
              <span className="font-semibold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                {formatCurrency(subtotal)}
              </span>
            </div>
            {appliedVoucher && (
              <div className="flex items-center justify-between text-[#30d158] font-semibold">
                <span>Voucher ({appliedVoucher.code}):</span>
                <span className="[font-variant-numeric:tabular-nums]">
                  -{formatCurrency(discount)}
                </span>
              </div>
            )}
            <div className="border-t border-black/[0.06] pt-2 flex items-center justify-between text-sm">
              <span className="font-bold text-[#1d1d1f]">Tổng cộng:</span>
              <span className="text-base font-bold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
