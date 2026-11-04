"use client";

import type { ProductDetail, ProductOptionValue } from "@/lib/api/types";
import type { PlacedItem } from "@/lib/compatibility-engine";
import { formatCurrency, cn } from "@/lib/utils";

interface ItemConfigPopoverProps {
  item: PlacedItem;
  product?: ProductDetail;
  onUpdate: (updated: Partial<PlacedItem>) => void;
  onDelete: (instanceId: string) => void;
  onClose: () => void;
}

export function ItemConfigPopover({
  item,
  product,
  onUpdate,
  onDelete,
  onClose
}: ItemConfigPopoverProps) {
  if (!product) return null;

  const optionGroups = product.options || product.optionTypes || [];

  const handleSelectOptionValue = (groupName: string, val: ProductOptionValue) => {
    const nextOptions = { ...item.options, [groupName]: val.value };

    // Find matched variant based on all current options
    let matchedVariant = product.variants?.find((v) => {
      if (!v.optionValues?.length) return false;
      return v.optionValues.every(
        (ov) => nextOptions[ov.optionType] === ov.value
      );
    });

    if (!matchedVariant && product.variants?.length) {
      matchedVariant = product.variants.find((v) =>
        v.optionValues?.some((ov) => ov.value === val.value)
      ) || product.variants[0];
    }

    const updates: Partial<PlacedItem> = {
      options: nextOptions,
      price: matchedVariant ? matchedVariant.price : item.price,
      sku: matchedVariant ? matchedVariant.sku : item.sku,
      variantId: matchedVariant ? matchedVariant.id : item.variantId
    };

    if (val.imageUrl) {
      updates.imageUrl = val.imageUrl;
    } else if (matchedVariant?.imageUrl) {
      updates.imageUrl = matchedVariant.imageUrl;
    }

    if (val.colorCode) {
      updates.colorCode = val.colorCode;
      updates.colorName = val.value;
    }

    onUpdate(updates);
  };

  return (
    <div
      className="absolute z-50 w-72 rounded-[20px] border border-black/[0.08] bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-all"
      style={{
        left: Math.min(Math.max(item.x - 30, 10), 650),
        top: Math.max(item.y - 200, 10)
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-black/[0.06] pb-3">
        <div className="min-w-0 pr-2">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#86868b]">
            {item.categoryName}
          </div>
          <h4 className="truncate text-sm font-bold text-[#1d1d1f]">
            {item.name}
          </h4>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-[#6e6e73]">
            <span>{item.sku}</span>
            <span>·</span>
            <span className="font-sans font-bold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
              {formatCurrency(item.price)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#86868b] hover:bg-black/[0.05] hover:text-[#1d1d1f]"
          aria-label="Đóng"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Option Groups */}
      <div className="space-y-3.5 py-3">
        {optionGroups.map((group) => {
          const isColor =
            group.name.toLowerCase().includes("màu") ||
            group.name.toLowerCase().includes("color") ||
            group.name.toLowerCase().includes("dây") ||
            group.values?.some((v) => !!v.colorCode);

          return (
            <div key={group.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#1d1d1f]">{group.name}</span>
                <span className="text-[#86868b]">
                  {item.options[group.name] || item.colorName || "Mặc định"}
                </span>
              </div>

              {isColor ? (
                /* Color Swatches with Apple Ring Highlight */
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {group.values?.map((val) => {
                    const isSelected =
                      item.options[group.name] === val.value ||
                      item.colorCode === val.colorCode ||
                      item.colorName === val.value;

                    return (
                      <button
                        key={val.id}
                        type="button"
                        onClick={() => handleSelectOptionValue(group.name, val)}
                        title={val.value}
                        className={cn(
                          "relative flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90",
                          isSelected
                            ? "ring-2 ring-[#0071e3] ring-offset-2"
                            : "hover:scale-110"
                        )}
                      >
                        <span
                          className="h-5 w-5 rounded-full border border-black/15 shadow-inner"
                          style={{ backgroundColor: val.colorCode || "#e3e4e5" }}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Regular Option Pills */
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {group.values?.map((val) => {
                    const isSelected = item.options[group.name] === val.value;
                    return (
                      <button
                        key={val.id}
                        type="button"
                        onClick={() => handleSelectOptionValue(group.name, val)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium transition active:scale-95",
                          isSelected
                            ? "bg-[#0071e3] text-white shadow-sm ring-2 ring-[#0071e3] ring-offset-1"
                            : "border border-black/[0.1] bg-white text-[#1d1d1f] hover:bg-black/[0.04]"
                        )}
                      >
                        {val.value}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-black/[0.06] pt-2.5">
        <button
          type="button"
          onClick={() => onDelete(item.instanceId)}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium text-[#ff3b30] hover:bg-[#ff3b30]/10 transition active:scale-95"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          <span>Xóa khỏi bàn</span>
        </button>

        <span className="text-[10px] text-[#86868b]">Kéo để di chuyển</span>
      </div>
    </div>
  );
}
