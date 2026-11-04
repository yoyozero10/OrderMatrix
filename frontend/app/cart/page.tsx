"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cartApi, couponApi } from "@/lib/api/services";
import type { Cart, Coupon } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "c-apple10",
    code: "APPLE10",
    discountType: "percentage",
    discountValue: 10,
    maxDiscountAmount: 2000000,
    minOrderValue: 1000000,
    usageLimit: 500,
    usedCount: 0,
    userUsageLimit: 1,
    startDate: "2026-01-01",
    endDate: "2028-12-31",
    isActive: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01"
  },
  {
    id: "c-apple500k",
    code: "APPLE500K",
    discountType: "fixed",
    discountValue: 500000,
    maxDiscountAmount: undefined,
    minOrderValue: 10000000,
    usageLimit: 200,
    usedCount: 0,
    userUsageLimit: 1,
    startDate: "2026-01-01",
    endDate: "2028-12-31",
    isActive: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01"
  },
  {
    id: "c-tech5",
    code: "TECH5",
    discountType: "percentage",
    discountValue: 5,
    maxDiscountAmount: 1000000,
    minOrderValue: 5000000,
    usageLimit: 500,
    usedCount: 0,
    userUsageLimit: 2,
    startDate: "2026-01-01",
    endDate: "2028-12-31",
    isActive: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01"
  },
  {
    id: "c-welcome10",
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    maxDiscountAmount: 500000,
    minOrderValue: 200000,
    usageLimit: 1000,
    usedCount: 0,
    userUsageLimit: 1,
    startDate: "2026-01-01",
    endDate: "2028-12-31",
    isActive: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01"
  }
];

export default function CartPage() {
  const router = useRouter();
  const auth = useRequireAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    coupon?: Coupon;
  } | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);

  // Load available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const list = await couponApi.getActiveCoupons();
        if (list && list.length > 0) {
          setAvailableCoupons(list);
        }
      } catch {
        // Keeps DEFAULT_COUPONS
      }
    };
    void fetchCoupons();
  }, []);

  // Restore stored voucher
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("om_applied_voucher");
      if (stored) {
        setAppliedVoucher(JSON.parse(stored));
      }
    } catch {
      // Ignore storage read error
    }
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
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Không thể tải giỏ hàng"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadCart();
  }, [auth.accessToken, auth.isAuthenticated]);

  const refreshCart = async () => {
    if (!auth.accessToken) return;
    const updated = await cartApi.getCart(auth.accessToken);
    setCart(updated);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!auth.accessToken) return;
    setBusyItemId(itemId);
    setError(null);
    try {
      await cartApi.updateItem(auth.accessToken, itemId, quantity);
      await refreshCart();
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Không thể cập nhật số lượng"));
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!auth.accessToken) return;
    setBusyItemId(itemId);
    setError(null);
    try {
      await cartApi.removeItem(auth.accessToken, itemId);
      await refreshCart();
    } catch (removeError) {
      setError(getErrorMessage(removeError, "Không thể xóa sản phẩm"));
    } finally {
      setBusyItemId(null);
    }
  };

  const handleApplyVoucher = async (targetCode?: string) => {
    const rawCode = targetCode || voucherCode;
    if (!rawCode.trim() || !cart) return;
    setIsApplyingVoucher(true);
    setVoucherMessage(null);
    setError(null);

    const total = Number(cart.totalAmount ?? 0);
    const code = rawCode.trim().toUpperCase();

    try {
      if (auth.accessToken) {
        const res = await couponApi.applyCoupon(auth.accessToken, {
          code,
          orderTotal: total
        });
        const applied = {
          code: res.coupon.code,
          discountAmount: res.discountAmount,
          coupon: res.coupon
        };
        setAppliedVoucher(applied);
        sessionStorage.setItem("om_applied_voucher", JSON.stringify(applied));
        setVoucherMessage(`Áp dụng mã ${res.coupon.code} thành công (-${formatCurrency(res.discountAmount)})`);
      }
    } catch (err) {
      // Offline fallback matching database seed rules
      if (code === "APPLE10") {
        if (total >= 1000000) {
          const disc = Math.min(Math.round((total * 10) / 100), 2000000);
          const applied = { code: "APPLE10", discountAmount: disc };
          setAppliedVoucher(applied);
          sessionStorage.setItem("om_applied_voucher", JSON.stringify(applied));
          setVoucherMessage(`Áp dụng mã APPLE10 thành công (-${formatCurrency(disc)})`);
        } else {
          setError("Mã APPLE10 yêu cầu đơn hàng tối thiểu 1.000.000 ₫");
        }
      } else if (code === "APPLE500K" || code === "GIAM500K") {
        if (total >= 10000000) {
          const applied = { code, discountAmount: 500000 };
          setAppliedVoucher(applied);
          sessionStorage.setItem("om_applied_voucher", JSON.stringify(applied));
          setVoucherMessage(`Áp dụng mã ${code} thành công (-500.000 ₫)`);
        } else {
          setError(`Mã ${code} chỉ áp dụng cho đơn từ 10.000.000 ₫`);
        }
      } else if (code === "WELCOME10") {
        if (total >= 200000) {
          const disc = Math.min(Math.round((total * 10) / 100), 500000);
          const applied = { code: "WELCOME10", discountAmount: disc };
          setAppliedVoucher(applied);
          sessionStorage.setItem("om_applied_voucher", JSON.stringify(applied));
          setVoucherMessage(`Áp dụng mã WELCOME10 thành công (-${formatCurrency(disc)})`);
        } else {
          setError("Mã WELCOME10 yêu cầu đơn hàng tối thiểu 200.000 ₫");
        }
      } else if (code === "TECH5") {
        if (total >= 5000000) {
          const disc = Math.min(Math.round((total * 5) / 100), 1000000);
          const applied = { code: "TECH5", discountAmount: disc };
          setAppliedVoucher(applied);
          sessionStorage.setItem("om_applied_voucher", JSON.stringify(applied));
          setVoucherMessage(`Áp dụng mã TECH5 thành công (-${formatCurrency(disc)})`);
        } else {
          setError("Mã TECH5 yêu cầu đơn hàng tối thiểu 5.000.000 ₫");
        }
      } else {
        setError(getErrorMessage(err, "Mã giảm giá không hợp lệ hoặc đã hết lượt dùng"));
      }
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherMessage(null);
    sessionStorage.removeItem("om_applied_voucher");
  };

  if (!auth.isReady || isLoading) {
    return (
      <Card className="py-16 text-center text-sm text-[#86868b]">
        Đang tải thông tin túi hàng...
      </Card>
    );
  }

  const items = cart?.items || [];
  const subtotal = Number(cart?.totalAmount ?? 0);
  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">Túi hàng của bạn</h1>
          <p className="text-xs text-[#86868b] mt-1">
            {items.length === 0
              ? "Túi hàng trống"
              : `Bạn đang có ${cart?.totalItems ?? items.length} sản phẩm`}
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary" size="sm" className="text-xs">
            Tiếp tục mua sắm
          </Button>
        </Link>
      </div>

      {voucherMessage && (
        <Card className="border-[#30d158]/20 bg-[#30d158]/5 py-3 px-4 text-xs font-semibold text-[#30d158]">
          {voucherMessage}
        </Card>
      )}

      {error && (
        <Card className="border-[#ff3b30]/20 bg-[#ff3b30]/5 py-3 px-4 text-xs font-semibold text-[#ff3b30]">
          {error}
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="py-20 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-black/[0.04] mx-auto grid place-items-center text-[#86868b]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1d1d1f]">Chưa có sản phẩm nào trong túi</p>
            <p className="text-xs text-[#86868b] mt-1">Khám phá các thiết bị Apple đỉnh cao ngay hôm nay.</p>
          </div>
          <Link href="/">
            <Button size="sm">Xem sản phẩm</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Cart Items List */}
          <div className="space-y-3">
            {items.map((item) => {
              const productName = item.variant?.product?.name || item.product?.name || "Thiết bị Apple";
              const sku = item.variant?.sku || "SKU-N/A";
              const unitPrice = Number(item.variant?.price || item.product?.price || 0);
              const imgUrl =
                item.variant?.product?.primaryImage ||
                item.product?.primaryImage ||
                "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300";

              return (
                <Card key={item.id} className="p-4 flex flex-col sm:flex-row items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={productName}
                    className="h-20 w-20 rounded-[14px] bg-[#fbfbfd] border border-black/[0.06] object-contain p-2"
                  />

                  <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                    <h2 className="text-sm font-bold text-[#1d1d1f] truncate">{productName}</h2>
                    <p className="font-mono text-[11px] text-[#86868b]">SKU: {sku}</p>
                    <p className="text-xs font-semibold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                      {formatCurrency(unitPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-black/[0.08] bg-[#fbfbfd] p-1">
                      <button
                        type="button"
                        aria-label="Giảm"
                        disabled={busyItemId === item.id || item.quantity <= 1}
                        onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                        className="h-6 w-6 grid place-items-center rounded-full text-xs text-[#6e6e73] hover:text-[#1d1d1f] disabled:opacity-30"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="min-w-[20px] text-center text-xs font-bold text-[#1d1d1f]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Tăng"
                        disabled={busyItemId === item.id}
                        onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                        className="h-6 w-6 grid place-items-center rounded-full text-xs text-[#6e6e73] hover:text-[#1d1d1f] disabled:opacity-30"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>

                    <div className="min-w-[100px] text-right text-sm font-bold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                      {formatCurrency(item.subtotal)}
                    </div>

                    <button
                      type="button"
                      aria-label="Xóa"
                      disabled={busyItemId === item.id}
                      onClick={() => void removeItem(item.id)}
                      className="p-1.5 text-[#86868b] hover:text-[#ff3b30] transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Cart Summary & Voucher Box */}
          <div className="space-y-4">
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">
                  Mã khuyến mãi & Ưu đãi
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-[10px] font-bold text-[#0071e3]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  Tối đa 2.000.000 ₫
                </span>
              </div>

              {/* Applied Voucher or Input Pill */}
              {appliedVoucher ? (
                <div className="flex items-center justify-between rounded-[14px] border border-[#30d158]/30 bg-[#30d158]/10 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-[#30d158] grid place-items-center text-white shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#1d1d1f] tracking-wide">
                          {appliedVoucher.code}
                        </span>
                        <span className="rounded bg-[#30d158]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#30d158]">
                          Đã áp dụng
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#30d158] mt-0.5 [font-variant-numeric:tabular-nums]">
                        Giảm -{formatCurrency(appliedVoucher.discountAmount)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeVoucher}
                    aria-label="Gỡ mã"
                    className="text-xs font-semibold text-[#86868b] hover:text-[#ff3b30] px-2 py-1 transition"
                  >
                    Gỡ bỏ
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã ưu đãi (ví dụ: APPLE10)"
                    className="h-10 flex-1 rounded-full border border-black/[0.08] bg-[#fbfbfd] px-4 text-xs uppercase font-mono text-[#1d1d1f] placeholder:normal-case placeholder:font-sans placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!voucherCode.trim() || isApplyingVoucher}
                    onClick={() => void handleApplyVoucher()}
                    className="h-10 px-4 text-xs font-semibold rounded-full"
                  >
                    {isApplyingVoucher ? "..." : "Áp dụng"}
                  </Button>
                </div>
              )}

              {/* Available Coupons List (Apple Liquid Glass Cards) */}
              <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                <div className="flex items-center justify-between text-[11px] text-[#86868b]">
                  <span className="font-medium">Ưu đãi có sẵn dành cho bạn</span>
                  <span>(Chọn 1-click)</span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
                  {availableCoupons.map((coupon) => {
                    const isSelected = appliedVoucher?.code === coupon.code;
                    const minOrder = Number(coupon.minOrderValue || 0);
                    const isEligible = subtotal >= minOrder;
                    const diffToEligible = minOrder - subtotal;

                    const discountText =
                      coupon.discountType === "percentage"
                        ? `Giảm ${coupon.discountValue}%${
                            coupon.maxDiscountAmount
                              ? ` (tối đa ${formatCurrency(Number(coupon.maxDiscountAmount))})`
                              : ""
                          }`
                        : `Giảm ${formatCurrency(Number(coupon.discountValue))}`;

                    return (
                      <div
                        key={coupon.id}
                        className={`rounded-[14px] border p-2.5 transition-all text-xs flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? "border-[#30d158] bg-[#30d158]/5"
                            : isEligible
                            ? "border-black/[0.08] bg-[#fbfbfd] hover:border-[#0071e3]/40 hover:bg-white"
                            : "border-black/[0.04] bg-black/[0.01] opacity-60"
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#1d1d1f] tracking-wide">
                              {coupon.code}
                            </span>
                            <span className="font-semibold text-[#0071e3] text-[11px]">
                              {discountText}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#86868b]">
                            {minOrder > 0
                              ? `Đơn tối thiểu ${formatCurrency(minOrder)}`
                              : "Áp dụng cho mọi giá trị đơn"}
                          </p>
                        </div>

                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#30d158] shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            Đang dùng
                          </span>
                        ) : isEligible ? (
                          <button
                            type="button"
                            onClick={() => void handleApplyVoucher(coupon.code)}
                            disabled={isApplyingVoucher}
                            className="rounded-full bg-[#0071e3] px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-95 shrink-0"
                          >
                            Áp dụng
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#86868b] text-right shrink-0">
                            Cần thêm {formatCurrency(diffToEligible)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="border-t border-black/[0.06] pt-4 space-y-2.5 text-xs text-[#6e6e73]">
                <div className="flex items-center justify-between">
                  <span>Số lượng sản phẩm:</span>
                  <span className="font-semibold text-[#1d1d1f]">{cart?.totalItems ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {appliedVoucher && (
                  <div className="flex items-center justify-between text-[#30d158] font-semibold">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      Giảm giá voucher ({appliedVoucher.code}):
                    </span>
                    <span className="[font-variant-numeric:tabular-nums]">
                      -{formatCurrency(discount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-black/[0.06] pt-2.5 flex items-center justify-between text-sm">
                  <span className="font-bold text-[#1d1d1f]">Tổng thanh toán:</span>
                  <span className="text-base font-bold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-sm font-semibold rounded-full"
                onClick={() => {
                  if (appliedVoucher) {
                    sessionStorage.setItem("om_applied_voucher", JSON.stringify(appliedVoucher));
                  } else {
                    sessionStorage.removeItem("om_applied_voucher");
                  }
                  router.push("/checkout");
                }}
              >
                Tiến hành đặt hàng
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
