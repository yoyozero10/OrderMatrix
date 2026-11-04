"use client";

import { useState } from "react";
import type { CompatibilityReport } from "@/lib/api/types";
import type { PlacedItem } from "@/lib/compatibility-engine";
import { formatCurrency, cn } from "@/lib/utils";

interface LiveHudProps {
  report: CompatibilityReport;
  items: PlacedItem[];
  onAddToCart: () => Promise<void>;
  isAddingToCart: boolean;
}

export function LiveHud({
  report,
  items,
  onAddToCart,
  isAddingToCart
}: LiveHudProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { power, colorHarmony, warnings, bundle } = report;

  // Power status color
  const powerStatusColor =
    power.status === "sufficient"
      ? "text-[#30d158] bg-[#30d158]/10 border-[#30d158]/30"
      : power.status === "deficit"
      ? "text-[#ff3b30] bg-[#ff3b30]/10 border-[#ff3b30]/30"
      : "text-[#86868b] bg-black/[0.04] border-black/[0.08]";

  const powerStatusLabel =
    power.status === "sufficient"
      ? "Đủ công suất"
      : power.status === "deficit"
      ? "Thiếu nguồn điện"
      : "Chưa có củ sạc";

  return (
    <div
      className={cn(
        "absolute right-4 top-4 z-30 transition-all duration-300",
        isCollapsed ? "w-auto" : "w-80 sm:w-96"
      )}
    >
      <div className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {/* HUD Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30d158] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30d158]" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1d1d1f]">
              Live Compatibility HUD
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.05] hover:text-[#1d1d1f]"
            aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("transition-transform", isCollapsed ? "rotate-180" : "")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Collapsed view summary */}
        {isCollapsed ? (
          <div className="mt-2 flex items-center gap-3 text-xs text-[#1d1d1f]">
            <span className="font-semibold">{items.length} thiết bị</span>
            <span>·</span>
            <span className="font-bold [font-variant-numeric:tabular-nums]">
              {formatCurrency(bundle.totalPrice)}
            </span>
          </div>
        ) : (
          <div className="mt-3.5 space-y-4">
            {/* 1. POWER METER (Đồng hồ công suất nguồn) */}
            <div className="rounded-[16px] bg-[#fbfbfd] border border-black/[0.06] p-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>Công suất nguồn</span>
                </span>
                <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full border", powerStatusColor)}>
                  {powerStatusLabel}
                </span>
              </div>

              {/* Power numbers */}
              <div className="grid grid-cols-2 gap-2 text-center my-2">
                <div className="rounded-[10px] bg-black/[0.03] p-1.5">
                  <div className="text-[10px] text-[#86868b]">Cần tối thiểu</div>
                  <div className="text-sm font-bold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                    {power.totalRequiredWatts} W
                  </div>
                </div>
                <div className="rounded-[10px] bg-black/[0.03] p-1.5">
                  <div className="text-[10px] text-[#86868b]">Đang cung cấp</div>
                  <div className="text-sm font-bold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                    {power.totalSuppliedWatts} W
                  </div>
                </div>
              </div>

              {/* Segmented Power Bar */}
              <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden flex">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    power.balanceWatts >= 0 ? "bg-[#30d158]" : "bg-[#ff3b30]"
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      power.totalRequiredWatts > 0
                        ? (power.totalSuppliedWatts / power.totalRequiredWatts) * 100
                        : power.totalSuppliedWatts > 0
                        ? 100
                        : 0
                    )}%`
                  }}
                />
              </div>
            </div>

            {/* 2. COLOR HARMONY SCORE (Điểm phối màu) */}
            <div className="rounded-[16px] bg-[#fbfbfd] border border-black/[0.06] p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m4.93 4.93 4.24 4.24" />
                    <path d="m14.83 9.17 4.24-4.24" />
                    <path d="m14.83 14.83 4.24 4.24" />
                    <path d="m9.17 14.83-4.24 4.24" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <span>Đồng điệu thiết kế</span>
                </span>
                <span className="text-xs font-bold text-[#0071e3] [font-variant-numeric:tabular-nums]">
                  {colorHarmony.score}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6e6e73]">
                <span className="font-medium text-[#1d1d1f]">{colorHarmony.theme}</span>
                {/* Dominant swatches */}
                {colorHarmony.dominantColors.length > 0 && (
                  <div className="flex items-center gap-1">
                    {colorHarmony.dominantColors.map((col, idx) => (
                      <span
                        key={idx}
                        className="h-2.5 w-2.5 rounded-full border border-black/15 shadow-inner"
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. WARNINGS / NOTICES */}
            {warnings.length > 0 && (
              <div className="space-y-1.5">
                {warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-2 rounded-[14px] p-2.5 text-[11.5px] leading-relaxed border",
                      w.level === "warning"
                        ? "bg-[#ff9500]/5 border-[#ff9500]/20 text-[#ff9500]"
                        : w.level === "error"
                        ? "bg-[#ff3b30]/5 border-[#ff3b30]/20 text-[#ff3b30]"
                        : "bg-[#0071e3]/5 border-[#0071e3]/20 text-[#0071e3]"
                    )}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div className="text-[#1d1d1f]">
                      <span className="font-semibold">{w.title}: </span>
                      <span className="text-[#6e6e73]">{w.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. BUNDLE PRICING & COUPON RECOMMENDATION */}
            <div className="rounded-[16px] bg-[#fbfbfd] border border-black/[0.06] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6e6e73]">
                <span>Tổng giá {items.length} thiết bị:</span>
                <span className="font-semibold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                  {formatCurrency(bundle.totalPrice)}
                </span>
              </div>

              {bundle.eligibleForBundle && bundle.suggestedCoupon && (
                <div className="flex items-center justify-between rounded-[10px] bg-[#30d158]/10 px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#30d158]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <span>Mã combo: {bundle.suggestedCoupon}</span>
                  </div>
                  <span className="font-bold text-[#30d158] [font-variant-numeric:tabular-nums]">
                    -{bundle.discountPercent}% (-{formatCurrency(bundle.discountAmount || 0)})
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-black/[0.06] pt-2 text-sm">
                <span className="font-bold text-[#1d1d1f]">Tổng trọn bộ:</span>
                <span className="text-base font-bold text-[#0071e3] [font-variant-numeric:tabular-nums]">
                  {formatCurrency(bundle.finalPrice || bundle.totalPrice)}
                </span>
              </div>
            </div>

            {/* 5. ADD ENTIRE BUNDLE TO CART */}
            <button
              type="button"
              disabled={items.length === 0 || isAddingToCart}
              onClick={onAddToCart}
              className={cn(
                "w-full h-11 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 active:scale-98 flex items-center justify-center gap-2",
                items.length > 0
                  ? "bg-[#0071e3] text-white shadow-[0_8px_20px_rgba(0,113,227,0.28)] hover:bg-[#0077ed]"
                  : "bg-black/[0.05] text-[#86868b] cursor-not-allowed"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>
                {isAddingToCart
                  ? "Đang nạp toàn bộ vào túi..."
                  : items.length > 0
                  ? `Thêm trọn bộ (${items.length} món) vào túi hàng`
                  : "Chọn thiết bị để thêm"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
