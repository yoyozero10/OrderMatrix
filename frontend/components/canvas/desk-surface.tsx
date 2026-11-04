"use client";

import { useState } from "react";
import type { ProductDetail } from "@/lib/api/types";
import type { PlacedItem } from "@/lib/compatibility-engine";
import { CanvasItem } from "./canvas-item";
import { ItemConfigPopover } from "./item-config-popover";

interface DeskSurfaceProps {
  items: PlacedItem[];
  catalog: ProductDetail[];
  selectedId: string | null;
  onSelect: (instanceId: string | null) => void;
  onMoveItem: (instanceId: string, x: number, y: number) => void;
  onUpdateItem: (instanceId: string, updated: Partial<PlacedItem>) => void;
  onDeleteItem: (instanceId: string) => void;
  onClearDesk: () => void;
  onApplyPreset: (presetName: "studio" | "mobility" | "creator") => void;
}

export function DeskSurface({
  items,
  catalog,
  selectedId,
  onSelect,
  onMoveItem,
  onUpdateItem,
  onDeleteItem,
  onClearDesk,
  onApplyPreset
}: DeskSurfaceProps) {
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.instanceId === (activeConfigId || selectedId));
  const selectedProduct = selectedItem
    ? catalog.find((p) => p.id === selectedItem.productId)
    : undefined;

  return (
    <div
      className="relative h-[82vh] min-h-[620px] w-full overflow-hidden rounded-[26px] border border-black/[0.08] bg-[#f5f5f7] select-none"
      style={{
        backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.08) 1.2px, transparent 1.2px)",
        backgroundSize: "24px 24px"
      }}
      onClick={() => {
        onSelect(null);
        setActiveConfigId(null);
      }}
    >
      {/* Subtle Apple Desk Mat area */}
      <div className="absolute inset-8 rounded-[24px] border border-black/[0.04] bg-white/[0.25] pointer-events-none" />

      {/* Top Left: Canvas Controls & Setup Presets */}
      <div
        className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preset Selector */}
        <div className="flex items-center rounded-full border border-black/[0.08] bg-white/95 p-1 shadow-sm backdrop-blur-md">
          <span className="px-3 text-[11px] font-semibold text-[#86868b] flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Preset gợi ý:</span>
          </span>
          <button
            type="button"
            onClick={() => onApplyPreset("studio")}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[#1d1d1f] hover:bg-black/[0.05] active:scale-95 transition"
          >
            Studio Pro
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset("mobility")}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[#1d1d1f] hover:bg-black/[0.05] active:scale-95 transition"
          >
            Di động
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset("creator")}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[#1d1d1f] hover:bg-black/[0.05] active:scale-95 transition"
          >
            Sáng tạo
          </button>
        </div>

        {/* Clear Desk Button */}
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearDesk}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/95 px-3 py-1.5 text-[11.5px] font-medium text-[#ff3b30] shadow-sm hover:bg-[#ff3b30]/10 backdrop-blur-md active:scale-95 transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <span>Dọn bàn</span>
          </button>
        )}
      </div>

      {/* Empty State Instruction */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 border border-black/[0.08] shadow-sm mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[#1d1d1f]">
            Bàn làm việc Apple Virtual Canvas
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#86868b] leading-relaxed">
            Chọn thiết bị từ Dock bên dưới hoặc thử một trong các Setup Preset để kiểm tra tương thích công suất, phối màu và nhận ưu đãi combo trọn bộ.
          </p>
        </div>
      )}

      {/* Placed Items on Desk */}
      {items.map((item) => (
        <CanvasItem
          key={item.instanceId}
          item={item}
          isSelected={selectedId === item.instanceId || activeConfigId === item.instanceId}
          onSelect={(id) => onSelect(id)}
          onMove={onMoveItem}
          onDelete={onDeleteItem}
          onOpenConfig={(id) => {
            onSelect(id);
            setActiveConfigId(id);
          }}
        />
      ))}

      {/* Item Configuration Mini Popover */}
      {activeConfigId && selectedItem && (
        <ItemConfigPopover
          item={selectedItem}
          product={selectedProduct}
          onUpdate={(updated) => onUpdateItem(selectedItem.instanceId, updated)}
          onDelete={(id) => {
            onDeleteItem(id);
            setActiveConfigId(null);
          }}
          onClose={() => setActiveConfigId(null)}
        />
      )}
    </div>
  );
}
