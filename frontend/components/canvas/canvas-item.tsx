"use client";

import React, { useRef, useState } from "react";
import type { PlacedItem } from "@/lib/compatibility-engine";
import { cn } from "@/lib/utils";

interface CanvasItemProps {
  item: PlacedItem;
  isSelected: boolean;
  onSelect: (instanceId: string) => void;
  onMove: (instanceId: string, x: number, y: number) => void;
  onDelete: (instanceId: string) => void;
  onOpenConfig: (instanceId: string) => void;
}

export function CanvasItem({
  item,
  isSelected,
  onSelect,
  onMove,
  onDelete,
  onOpenConfig
}: CanvasItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; itemX: number; itemY: number }>({
    startX: 0,
    startY: 0,
    itemX: 0,
    itemY: 0
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(item.instanceId);

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      itemX: item.x,
      itemY: item.y
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = Math.max(0, dragStartRef.current.itemX + deltaX);
    const newY = Math.max(0, dragStartRef.current.itemY + deltaY);

    onMove(item.instanceId, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      className={cn(
        "group absolute select-none cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "opacity-90 cursor-grabbing scale-105"
      )}
      style={{
        left: item.x,
        top: item.y,
        zIndex: isSelected ? 40 : item.zIndex
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.instanceId);
      }}
    >
      {/* Device Card Body */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-[20px] p-2.5 transition-all duration-200",
          isSelected
            ? "bg-white/80 backdrop-blur-md shadow-[0_12px_32px_rgba(0,113,227,0.18)] ring-2 ring-[#0071e3] ring-offset-2"
            : "hover:bg-white/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
        )}
      >
        {/* Quick Action Buttons on Hover or Selection */}
        <div
          className={cn(
            "absolute -top-3.5 right-1 flex items-center gap-1 transition-opacity",
            isSelected ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Configure / Color Swatch Button */}
          <button
            type="button"
            onClick={() => onOpenConfig(item.instanceId)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-black/[0.08] text-[#1d1d1f] shadow-sm hover:bg-[#f5f5f7] active:scale-90"
            title="Tùy chỉnh màu sắc & cấu hình"
            aria-label="Tùy chỉnh"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(item.instanceId)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-black/[0.08] text-[#ff3b30] shadow-sm hover:bg-[#ff3b30]/10 active:scale-90"
            title="Xóa khỏi bàn"
            aria-label="Xóa"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Device Image */}
        <div className="relative flex items-center justify-center p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.name}
            draggable={false}
            className="h-28 w-auto max-w-[170px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        {/* Floating Mini Caption / Color Pill */}
        <div className="mt-1 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 shadow-sm border border-black/[0.06] backdrop-blur-sm">
          {item.colorCode && (
            <span
              className="h-2.5 w-2.5 rounded-full border border-black/15 shadow-inner shrink-0"
              style={{ backgroundColor: item.colorCode }}
              title={item.colorName || "Màu sắc"}
            />
          )}
          <span className="truncate max-w-[110px] text-[11px] font-semibold text-[#1d1d1f]">
            {item.name.replace("Apple", "").trim()}
          </span>
        </div>
      </div>
    </div>
  );
}
