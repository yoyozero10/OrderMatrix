"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminCouponApi } from "@/lib/api/services";
import type { Coupon } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function AdminCouponsPage() {
  const auth = useRequireAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 10,
    maxDiscountAmount: 500000,
    minOrderValue: 0,
    usageLimit: 100
  });

  const loadCoupons = async () => {
    if (!auth.accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminCouponApi.getAllCoupons(auth.accessToken);
      setCoupons(res);
    } catch {
      // Offline fallback
      setCoupons([
        {
          id: "cpn-1",
          code: "APPLE10",
          discountType: "percentage",
          discountValue: 10,
          maxDiscountAmount: 500000,
          minOrderValue: 0,
          usageLimit: 100,
          usedCount: 14,
          isActive: true
        },
        {
          id: "cpn-2",
          code: "GIAM500K",
          discountType: "fixed",
          discountValue: 500000,
          maxDiscountAmount: 500000,
          minOrderValue: 10000000,
          usageLimit: 50,
          usedCount: 8,
          isActive: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      void loadCoupons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.accessToken]);

  const handleToggle = async (coupon: Coupon) => {
    if (!auth.accessToken) return;
    try {
      await adminCouponApi.toggleCoupon(auth.accessToken, coupon.id);
      setNotice(`Đã chuyển trạng thái mã ${coupon.code}`);
      await loadCoupons();
    } catch {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      );
      setNotice(`Đã chuyển trạng thái mã ${coupon.code} (Offline)`);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!auth.accessToken) return;
    if (!confirm(`Bạn có chắc muốn xóa mã ${code}?`)) return;
    try {
      await adminCouponApi.deleteCoupon(auth.accessToken, id);
      setNotice(`Đã xóa mã ${code}`);
      await loadCoupons();
    } catch {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setNotice(`Đã xóa mã ${code} (Offline)`);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.accessToken || !form.code.trim()) return;
    setIsSubmitting(true);
    setError(null);

    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      minOrderValue: Number(form.minOrderValue || 0),
      usageLimit: Number(form.usageLimit || 100)
    };

    try {
      await adminCouponApi.createCoupon(auth.accessToken, payload);
      setNotice(`Đã tạo thành công voucher ${payload.code}`);
      setShowAddForm(false);
      setForm({
        code: "",
        discountType: "percentage",
        discountValue: 10,
        maxDiscountAmount: 500000,
        minOrderValue: 0,
        usageLimit: 100
      });
      await loadCoupons();
    } catch {
      // Offline fallback
      setCoupons((prev) => [
        {
          id: `cpn-${Date.now()}`,
          ...payload,
          usedCount: 0,
          isActive: true
        },
        ...prev
      ]);
      setNotice(`Đã tạo thành công voucher ${payload.code} (Offline)`);
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">Quản lý mã giảm giá (Vouchers)</h1>
          <p className="mt-1 text-xs text-[#6e6e73]">Thiết lập và quản lý các chương trình ưu đãi khuyến mãi.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="self-start sm:self-auto"
        >
          {showAddForm ? "Đóng form" : "+ Tạo voucher mới"}
        </Button>
      </div>

      {notice && (
        <Card className="border-[#30d158]/20 bg-[#30d158]/5 py-2.5 px-4 text-xs font-semibold text-[#30d158]">
          {notice}
        </Card>
      )}

      {error && (
        <Card className="border-[#ff3b30]/20 bg-[#ff3b30]/5 py-2.5 px-4 text-xs font-semibold text-[#ff3b30]">
          {error}
        </Card>
      )}

      {showAddForm && (
        <Card className="p-6">
          <h2 className="text-sm font-bold text-[#1d1d1f] mb-4">Tạo mã giảm giá mới</h2>
          <form onSubmit={handleCreateCoupon} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Mã Voucher (Code)</label>
              <Input
                required
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="VÍ DỤ: SALE2026"
                className="uppercase font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Loại giảm giá</label>
              <Select
                value={form.discountType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, discountType: e.target.value as "percentage" | "fixed" }))
                }
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (₫)</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">
                Giá trị giảm ({form.discountType === "percentage" ? "%" : "₫"})
              </label>
              <Input
                type="number"
                required
                value={form.discountValue}
                onChange={(e) => setForm((p) => ({ ...p, discountValue: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Giảm tối đa (₫)</label>
              <Input
                type="number"
                value={form.maxDiscountAmount}
                onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Đơn tối thiểu (₫)</label>
              <Input
                type="number"
                value={form.minOrderValue}
                onChange={(e) => setForm((p) => ({ ...p, minOrderValue: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1d1d1f]">Giới hạn lượt dùng</label>
              <Input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: Number(e.target.value) }))}
              />
            </div>

            <div className="sm:col-span-2 pt-2">
              <Button type="submit" loading={isSubmitting} className="w-full text-xs">
                Xác nhận tạo mã voucher
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Coupons Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#fbfbfd] text-[#86868b]">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Mã Code</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Ưu đãi</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Đơn tối thiểu</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Lượt dùng</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Trạng thái</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#86868b]">
                    Đang tải danh sách voucher...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#86868b]">
                    Chưa có mã giảm giá nào.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-black/[0.01] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#1d1d1f]">{c.code}</td>
                    <td className="py-3 px-4 font-semibold text-[#0071e3]">
                      {c.discountType === "percentage"
                        ? `Giảm ${c.discountValue}%`
                        : `-${formatCurrency(c.discountValue)}`}
                    </td>
                    <td className="py-3 px-4 text-[#6e6e73] [font-variant-numeric:tabular-nums]">
                      {c.minOrderValue ? formatCurrency(c.minOrderValue) : "Không yêu cầu"}
                    </td>
                    <td className="py-3 px-4 text-[#6e6e73] [font-variant-numeric:tabular-nums]">
                      {c.usedCount ?? 0} / {c.usageLimit ?? "∞"}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => void handleToggle(c)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                          c.isActive
                            ? "bg-[#30d158]/10 text-[#30d158]"
                            : "bg-black/[0.06] text-[#86868b]"
                        }`}
                      >
                        {c.isActive ? "Hoạt động" : "Tạm ngưng"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleDelete(c.id, c.code)}
                        className="text-xs text-[#ff3b30] hover:bg-[#ff3b30]/10"
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
