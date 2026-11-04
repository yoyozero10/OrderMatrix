"use client";

import { useMemo, useState } from "react";
import type { ProductDetail } from "@/lib/api/types";
import type { PlacedItem } from "@/lib/compatibility-engine";
import { formatCurrency, cn } from "@/lib/utils";

interface DeviceDockProps {
  catalog: ProductDetail[];
  placedItems: PlacedItem[];
  onAddItem: (product: ProductDetail) => void;
}

const CATEGORIES = [
  { id: "all", name: "Tất cả" },
  { id: "mac", name: "Mac" },
  { id: "ipad", name: "iPad" },
  { id: "phone", name: "iPhone" },
  { id: "watch", name: "Watch" },
  { id: "audio", name: "Âm thanh" },
  { id: "acc", name: "Phụ kiện" }
];

export function DeviceDock({
  catalog,
  placedItems,
  onAddItem
}: DeviceDockProps) {
  const [selectedCat, setSelectedCat] = useState("all");

  const filteredCatalog = useMemo(() => {
    if (selectedCat === "all") return catalog;
    return catalog.filter((p) => {
      const name = p.name.toLowerCase();
      const cat = (p.category?.name || "").toLowerCase();
      if (selectedCat === "mac") return name.includes("macbook") || cat.includes("laptop");
      if (selectedCat === "ipad") return name.includes("ipad") || cat.includes("bảng");
      if (selectedCat === "phone") return name.includes("iphone") || cat.includes("thoại");
      if (selectedCat === "watch") return name.includes("watch") || cat.includes("đồng hồ");
      if (selectedCat === "audio") return name.includes("airpods") || cat.includes("âm thanh");
      if (selectedCat === "acc") return name.includes("sạc") || name.includes("cáp") || cat.includes("phụ kiện");
      return true;
    });
  }, [catalog, selectedCat]);

  // Count placed items per product id
  const placedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    placedItems.forEach((it) => {
      counts[it.productId] = (counts[it.productId] || 0) + 1;
    });
    return counts;
  }, [placedItems]);

  return (
    <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 max-w-[94vw] w-auto">
      <div className="flex flex-col items-center rounded-[26px] border border-black/[0.08] bg-white/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        {/* Category Pills */}
        <div className="mb-2.5 flex items-center gap-1 overflow-x-auto px-2 py-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={cn(
                "rounded-full px-3 py-1 text-[11.5px] font-medium transition active:scale-95 shrink-0",
                selectedCat === cat.id
                  ? "bg-[#1d1d1f] text-white shadow-sm"
                  : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04]"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dock Device Items */}
        <div className="flex items-center gap-3 overflow-x-auto px-2 py-1 scrollbar-none max-w-[85vw]">
          {filteredCatalog.map((product) => {
            const count = placedCounts[product.id] || 0;
            const primaryImg =
              product.images?.find((img) => img.isPrimary)?.imageUrl ||
              product.images?.[0]?.imageUrl ||
              "";

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onAddItem(product)}
                className="group relative flex h-28 w-24 shrink-0 flex-col items-center justify-between rounded-[18px] border border-black/[0.06] bg-[#fbfbfd] p-2 transition-all duration-200 hover:-translate-y-1 hover:border-black/20 hover:bg-white hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] active:scale-95"
                title={`Thêm ${product.name} vào bàn`}
              >
                {/* Placed Counter Badge */}
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0071e3] px-1 text-[10px] font-bold text-white shadow-sm">
                    {count}
                  </span>
                )}

                {/* Device Thumbnail */}
                <div className="flex h-12 w-full items-center justify-center overflow-hidden pt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImg}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain transition-transform group-hover:scale-110"
                  />
                </div>

                {/* Product Name & Price */}
                <div className="w-full text-center">
                  <div className="truncate text-[11px] font-semibold text-[#1d1d1f]">
                    {product.name.replace("Apple", "").trim()}
                  </div>
                  <div className="text-[10px] font-medium text-[#86868b] [font-variant-numeric:tabular-nums]">
                    {formatCurrency(product.basePrice ?? product.price ?? 0)}
                  </div>
                </div>

                {/* Plus Icon Overlay on Hover */}
                <span className="absolute inset-0 flex items-center justify-center rounded-[18px] bg-white/80 backdrop-blur-[2px] opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0071e3] text-white shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
