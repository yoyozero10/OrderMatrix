"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { productApi, cartApi, compatibilityApi } from "@/lib/api/services";
import type { ProductDetail } from "@/lib/api/types";
import { CANVAS_CATALOG } from "@/lib/canvas-catalog";
import {
  analyzeCompatibility,
  type PlacedItem
} from "@/lib/compatibility-engine";
import { DeskSurface } from "@/components/canvas/desk-surface";
import { DeviceDock } from "@/components/canvas/device-dock";
import { LiveHud } from "@/components/canvas/live-hud";
import { useAuth } from "@/providers/auth-provider";

export default function CanvasPage() {
  const router = useRouter();
  const auth = useAuth();

  const [catalog, setCatalog] = useState<ProductDetail[]>(CANVAS_CATALOG);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load backend catalog when available
  useEffect(() => {
    productApi
      .getProducts({ limit: 50 })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          // Merge with detailed canvas catalog for optimal options & visuals
          const merged = CANVAS_CATALOG.map((fallbackItem) => {
            const apiMatch = res.data.find(
              (p) =>
                p.id === fallbackItem.id ||
                p.name.toLowerCase().includes(fallbackItem.name.toLowerCase().slice(0, 10))
            );
            if (apiMatch) {
              return {
                ...fallbackItem,
                id: apiMatch.id,
                price: apiMatch.basePrice ?? apiMatch.price ?? fallbackItem.price,
                basePrice: apiMatch.basePrice ?? apiMatch.price ?? fallbackItem.basePrice
              };
            }
            return fallbackItem;
          });
          setCatalog(merged);
        }
      })
      .catch(() => {
        // Use full offline CANVAS_CATALOG
        setCatalog(CANVAS_CATALOG);
      });
  }, []);

  // Compute live compatibility report
  const report = useMemo(() => {
    return analyzeCompatibility(placedItems);
  }, [placedItems]);

  // Attempt backend validation in background when variant IDs change
  useEffect(() => {
    if (placedItems.length === 0) return;
    const variantIds = placedItems.map((i) => i.variantId).filter(Boolean);
    if (variantIds.length === 0) return;

    compatibilityApi
      .validate({ variantIds })
      .catch(() => {
        // Silently keep local engine calculation
      });
  }, [placedItems]);

  // Add a product from dock to desk
  const handleAddItem = (product: ProductDetail) => {
    const instanceId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optGroups = product.options || product.optionTypes || [];

    const defaultOptions: Record<string, string> = {};
    let chosenColorCode: string | undefined;
    let chosenColorName: string | undefined;
    let chosenImg =
      product.images?.find((img) => img.isPrimary)?.imageUrl ||
      product.images?.[0]?.imageUrl ||
      "";

    optGroups.forEach((g) => {
      if (g.values?.length) {
        defaultOptions[g.name] = g.values[0].value;
        if (g.values[0].colorCode) {
          chosenColorCode = g.values[0].colorCode;
          chosenColorName = g.values[0].value;
        }
        if (g.values[0].imageUrl) {
          chosenImg = g.values[0].imageUrl;
        }
      }
    });

    const firstVariant = product.variants?.[0];
    const initialPrice = firstVariant ? firstVariant.price : (product.basePrice ?? product.price ?? 0);
    const initialSku = firstVariant ? firstVariant.sku : `SKU-${product.id.slice(0, 6).toUpperCase()}`;

    // Compute staggered position on desk
    const count = placedItems.length;
    const initialX = 60 + ((count * 90) % 520);
    const initialY = 120 + ((count * 50) % 240);

    const newItem: PlacedItem = {
      instanceId,
      productId: product.id,
      variantId: firstVariant ? firstVariant.id : product.id,
      name: product.name,
      categoryName: product.category?.name || "Thiết bị",
      sku: initialSku,
      price: initialPrice,
      imageUrl: chosenImg,
      colorCode: chosenColorCode,
      colorName: chosenColorName,
      options: defaultOptions,
      x: initialX,
      y: initialY,
      zIndex: count + 1
    };

    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedId(instanceId);
  };

  // Move an item on desk
  const handleMoveItem = (instanceId: string, x: number, y: number) => {
    setPlacedItems((prev) =>
      prev.map((it) => (it.instanceId === instanceId ? { ...it, x, y } : it))
    );
  };

  // Update item options/color
  const handleUpdateItem = (instanceId: string, updated: Partial<PlacedItem>) => {
    setPlacedItems((prev) =>
      prev.map((it) => (it.instanceId === instanceId ? { ...it, ...updated } : it))
    );
  };

  // Delete item from desk
  const handleDeleteItem = (instanceId: string) => {
    setPlacedItems((prev) => prev.filter((it) => it.instanceId !== instanceId));
    if (selectedId === instanceId) setSelectedId(null);
  };

  // Clear entire desk
  const handleClearDesk = () => {
    setPlacedItems([]);
    setSelectedId(null);
  };

  // Setup Presets
  const handleApplyPreset = (presetName: "studio" | "mobility" | "creator") => {
    const itemsToAdd: { productId: string; x: number; y: number }[] = [];

    if (presetName === "studio") {
      itemsToAdd.push(
        { productId: "p-mbp-16", x: 180, y: 140 },
        { productId: "p-adapter-20w", x: 50, y: 160 }, // Intentionally creates 20W vs 140W warning for live power meter demo!
        { productId: "p-cable-magsafe", x: 70, y: 280 },
        { productId: "p-airpods-max", x: 420, y: 130 }
      );
    } else if (presetName === "mobility") {
      itemsToAdd.push(
        { productId: "p-mba-15", x: 160, y: 150 },
        { productId: "p-iphone-16", x: 380, y: 160 },
        { productId: "p-watch-ultra", x: 490, y: 180 }
      );
    } else {
      itemsToAdd.push(
        { productId: "p-ipad-pro", x: 160, y: 130 },
        { productId: "p-iphone-16", x: 340, y: 150 },
        { productId: "p-airpods-pro", x: 450, y: 190 }
      );
    }

    const newPlaced: PlacedItem[] = [];
    itemsToAdd.forEach((target, idx) => {
      const prod = catalog.find((p) => p.id === target.productId) || catalog[0];
      const optGroups = prod.options || prod.optionTypes || [];
      const defaultOptions: Record<string, string> = {};
      let chosenColorCode: string | undefined;
      let chosenColorName: string | undefined;
      let chosenImg =
        prod.images?.find((img) => img.isPrimary)?.imageUrl ||
        prod.images?.[0]?.imageUrl ||
        "";

      optGroups.forEach((g) => {
        if (g.values?.length) {
          defaultOptions[g.name] = g.values[0].value;
          if (g.values[0].colorCode) {
            chosenColorCode = g.values[0].colorCode;
            chosenColorName = g.values[0].value;
          }
          if (g.values[0].imageUrl) {
            chosenImg = g.values[0].imageUrl;
          }
        }
      });

      const firstVariant = prod.variants?.[0];
      const initialPrice = firstVariant ? firstVariant.price : (prod.basePrice ?? prod.price ?? 0);
      const initialSku = firstVariant ? firstVariant.sku : `SKU-${prod.id.slice(0, 6).toUpperCase()}`;

      newPlaced.push({
        instanceId: `preset-${Date.now()}-${idx}`,
        productId: prod.id,
        variantId: firstVariant ? firstVariant.id : prod.id,
        name: prod.name,
        categoryName: prod.category?.name || "Thiết bị",
        sku: initialSku,
        price: initialPrice,
        imageUrl: chosenImg,
        colorCode: chosenColorCode,
        colorName: chosenColorName,
        options: defaultOptions,
        x: target.x,
        y: target.y,
        zIndex: idx + 1
      });
    });

    setPlacedItems(newPlaced);
    setSelectedId(null);
    setNotice(`Đã nạp preset "${presetName.toUpperCase()}" lên bàn làm việc.`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Add entire bundle to cart
  const handleAddToCart = async () => {
    if (placedItems.length === 0) return;

    if (!auth.accessToken) {
      router.push("/login");
      return;
    }

    setIsAddingToCart(true);
    setError(null);
    setNotice(null);

    try {
      // Add each item on desk to cart sequentially
      for (const item of placedItems) {
        await cartApi.addItem(auth.accessToken, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: 1
        });
      }

      setNotice(`Đã thêm thành công trọn bộ ${placedItems.length} thiết bị vào túi hàng!`);
      setTimeout(() => {
        router.push("/cart");
      }, 700);
    } catch {
      setError("Không thể thêm vào giỏ hàng máy chủ, vui lòng kiểm tra kết nối");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
              Apple Setup Canvas
            </h1>
            <span className="rounded-full bg-[#0071e3]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0071e3]">
              AI Compatibility Engine
            </span>
          </div>
          <p className="text-xs text-[#86868b]">
            Thiết kế góc làm việc Apple trong mơ, tự động phân tích công suất nguồn, tính điểm phối màu và tối ưu chi phí combo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1d1d1f] shadow-sm hover:bg-[#fbfbfd] transition active:scale-95"
          >
            Xem giỏ hàng →
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div className="rounded-[14px] border border-[#30d158]/30 bg-[#30d158]/10 px-4 py-2.5 text-xs font-semibold text-[#30d158]">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-[14px] border border-[#ff3b30]/30 bg-[#ff3b30]/10 px-4 py-2.5 text-xs font-semibold text-[#ff3b30]">
          {error}
        </div>
      )}

      {/* Canvas Workspace Area */}
      <div className="relative">
        <DeskSurface
          items={placedItems}
          catalog={catalog}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMoveItem={handleMoveItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onClearDesk={handleClearDesk}
          onApplyPreset={handleApplyPreset}
        />

        {/* Live Compatibility HUD Panel */}
        <LiveHud
          report={report}
          items={placedItems}
          onAddToCart={handleAddToCart}
          isAddingToCart={isAddingToCart}
        />

        {/* Device Dock */}
        <DeviceDock
          catalog={catalog}
          placedItems={placedItems}
          onAddItem={handleAddItem}
        />
      </div>
    </div>
  );
}
