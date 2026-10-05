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

export default function CartPage() {
  const router = useRouter();
  const auth = useRequireAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    coupon?: Coupon;
  } | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);

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

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !cart) return;
    setIsApplyingVoucher(true);
    setVoucherMessage(null);
    setError(null);

    const total = Number(cart.totalAmount ?? 0);
    const code = voucherCode.trim().toUpperCase();

    try {
      if (auth.accessToken) {
        const res = await couponApi.applyCoupon(auth.accessToken, {
          code,
          orderTotal: total
        });
        setAppliedVoucher({
          code: res.coupon.code,
          discountAmount: res.discountAmount,
          coupon: res.coupon
        });
        setVoucherMessage(`Áp dụng mã ${res.coupon.code} thành công (-${formatCurrency(res.discountAmount)})`);
      }
    } catch (err) {
      // Offline fallback
      if (code === "APPLE10") {
        const disc = Math.round((total * 10) / 100);
        setAppliedVoucher({ code: "APPLE10", discountAmount: disc });
        setVoucherMessage(`Áp dụng mã APPLE10 thành công (-${formatCurrency(disc)})`);
      } else if (code === "GIAM500K") {
        if (total >= 10000000) {
          setAppliedVoucher({ code: "GIAM500K", discountAmount: 500000 });
          setVoucherMessage(`Áp dụng mã GIAM500K thành công (-500.000 ₫)`);
        } else {
          setError("Mã GIAM500K chỉ áp dụng cho đơn từ 10.000.000 ₫");
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
  };

  if (!auth.isReady || isLoading) {
    return (
      <Card className="py-16 text-center text-sm text-[#86868b]">
        Đang tải thông tin túi hàng...
      </Card>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = Number(cart?.totalAmount ?? 0);
  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">Túi hàng của bạn</h1>
        <p className="mt-1 text-sm text-[#6e6e73]">Xem lại số lượng và áp dụng mã giảm giá trước khi thanh toán.</p>
      </div>

      {error && (
        <Card className="border-[#ff3b30]/20 bg-[#ff3b30]/5 py-3 text-sm text-[#ff3b30]">
          {error}
        </Card>
      )}

      {voucherMessage && (
        <Card className="border-[#30d158]/20 bg-[#30d158]/5 py-3 text-sm text-[#30d158] font-medium">
          {voucherMessage}
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="space-y-4 py-16 text-center">
          <p className="text-sm text-[#86868b]">Túi hàng của bạn hiện đang trống.</p>
          <Link href="/">
            <Button size="sm">Tiếp tục mua sắm</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Cart Item List */}
          <div className="space-y-3">
            {items.map((item) => {
              const productName = item.variant?.product?.name || item.product?.name || "Sản phẩm";
              const productImg =
                item.variant?.product?.primaryImage ||
                item.product?.primaryImage ||
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200";
              const price = Number(item.variant?.price || item.product?.price || 0);

              return (
                <Card
                  key={item.id}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-[12px] bg-[#fbfbfd] border border-black/[0.06]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={productImg} alt={productName} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1d1d1f]">{productName}</p>
                      {item.variant?.sku && (
                        <p className="font-mono text-[11px] text-[#86868b]">{item.variant.sku}</p>
                      )}
                      <p className="mt-0.5 text-xs font-bold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                        {formatCurrency(price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.06]">
                    <div className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#fbfbfd] px-2 py-0.5">
                      <button
                        type="button"
                        aria-label="Giảm"
                        disabled={item.quantity <= 1 || busyItemId === item.id}
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

          {/* Cart Summary & Voucher */}
          <div className="space-y-4">
            <Card className="space-y-4 p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b]">Mã khuyến mãi</h2>

              {/* Voucher Input or Badge */}
              {appliedVoucher ? (
                <div className="flex items-center justify-between rounded-full border border-[#30d158]/30 bg-[#30d158]/10 px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2">
                      <path d="m9 11 3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span className="font-mono text-xs font-bold text-[#1d1d1f]">{appliedVoucher.code}</span>
                    <span className="text-xs font-semibold text-[#30d158]">
                      -{formatCurrency(appliedVoucher.discountAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeVoucher}
                    aria-label="Gỡ mã"
                    className="text-[#86868b] hover:text-[#ff3b30]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Mã giảm giá (ví dụ: APPLE10)"
                    className="h-9 flex-1 rounded-full border border-black/[0.08] bg-[#fbfbfd] px-3.5 text-xs uppercase font-mono text-[#1d1d1f] placeholder:normal-case placeholder:font-sans placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!voucherCode.trim() || isApplyingVoucher}
                    onClick={() => void handleApplyVoucher()}
                    className="text-xs"
                  >
                    {isApplyingVoucher ? "..." : "Áp dụng"}
                  </Button>
                </div>
              )}

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
                    <span>Giảm giá ({appliedVoucher.code}):</span>
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
                className="w-full text-sm font-semibold"
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
