"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { categoryApi, productApi } from "@/lib/api/services";
import type { Category, ProductFilters, ProductListItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const DEFAULT_FILTERS: ProductFilters = {
  page: 1,
  limit: 24,
  sortBy: "newest"
};

export default function HomePage() {
  const router = useRouter();

  const [filters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        setCategories(response);
      } catch {
        const now = new Date().toISOString();
        // Fallback demo categories
        setCategories([
          { id: "c-1", name: "Điện thoại", description: "", createdAt: now },
          { id: "c-2", name: "Laptop", description: "", createdAt: now },
          { id: "c-3", name: "Máy tính bảng", description: "", createdAt: now },
          { id: "c-4", name: "Phụ kiện", description: "", createdAt: now }
        ]);
      }
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productApi.getProducts(filters);
        // Map products and attach colors if available
        const loaded = (response.data || []).map((p) => ({
          ...p,
          basePrice: p.basePrice ?? p.price,
          price: p.basePrice ?? p.price
        }));
        setProducts(loaded);
      } catch {
        const now = new Date().toISOString();
        // Fallback demo products with colors and basePrice
        setProducts([
          {
            id: "p-iphone15",
            name: "iPhone 15 Pro Max",
            description: "Khung titan chuẩn hàng không vũ trụ, chip A17 Pro mạnh mẽ vượt trội.",
            basePrice: 29990000,
            price: 29990000,
            stock: 45,
            status: "active",
            primaryImage: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600",
            category: { id: "c-1", name: "Điện thoại" },
            colors: ["#9c958d", "#3b4454", "#e3e4e5", "#242527"],
            createdAt: now,
            updatedAt: now
          },
          {
            id: "p-macbookpro",
            name: "MacBook Pro 16 inch M3 Max",
            description: "Hiệu năng đồ họa đỉnh cao, màn hình Liquid Retina XDR sáng 1600 nits.",
            basePrice: 64990000,
            price: 64990000,
            stock: 20,
            status: "active",
            primaryImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
            category: { id: "c-2", name: "Laptop" },
            colors: ["#2e3033", "#e0e2e5"],
            createdAt: now,
            updatedAt: now
          },
          {
            id: "p-ipadpro",
            name: "iPad Pro 13 inch M4",
            description: "Mỏng không tưởng, màn hình Ultra Retina XDR đỉnh cao công nghệ OLED kép.",
            basePrice: 37990000,
            price: 37990000,
            stock: 35,
            status: "active",
            primaryImage: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600",
            category: { id: "c-3", name: "Máy tính bảng" },
            colors: ["#2e3033", "#e0e2e5"],
            createdAt: now,
            updatedAt: now
          },
          {
            id: "p-applewatch",
            name: "Apple Watch Ultra 2",
            description: "Vỏ titan 49mm siêu bền bỉ, GPS tần số kép chính xác, pin tới 72 giờ.",
            basePrice: 21990000,
            price: 21990000,
            stock: 50,
            status: "active",
            primaryImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
            category: { id: "c-4", name: "Phụ kiện" },
            colors: ["#e88038", "#2c4059", "#d4d5d9"],
            createdAt: now,
            updatedAt: now
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    void loadProducts();
  }, [filters]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "all" ||
        p.category?.name?.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="space-y-10">
      {/* 1. STATUS BAR */}
      <div className="-mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 border-b border-black/[0.06] bg-[#fbfbfd] text-[11.5px] text-[#86868b]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30d158] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30d158]"></span>
            </span>
            <span>Hệ thống trực tuyến</span>
          </div>
          <div className="hidden sm:block">Kiến trúc đa biến thể SKU · TypeORM MySQL · REST API 1.0</div>
        </div>
      </div>

      {/* 2. EDITORIAL HERO */}
      <section className="text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#1d1d1f] shadow-sm mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-[#30d158]"></span>
          ORDERMATRIX · APPLE LIQUID GLASS
        </div>

        <h1 className="mx-auto max-w-4xl text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1d1d1f] leading-[1.15]">
          Hệ thống thương mại điện tử &amp; Quản lý biến thể SKU
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#6e6e73]">
          Trải nghiệm mua sắm mượt mà, đồng bộ giỏ hàng theo phiên và kiểm soát hàng tồn kho đa chiều với độ trễ tối thiểu.
        </p>

        {/* Active Promotional Vouchers Pill */}
        <div className="mx-auto mt-6 flex max-w-fit items-center flex-wrap justify-center gap-2 rounded-full border border-black/[0.08] bg-[#fbfbfd] p-1.5 px-3.5 text-xs shadow-sm">
          <span className="flex items-center gap-1.5 font-semibold text-[#0071e3]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            Ưu đãi đang chạy:
          </span>
          <span className="rounded-full bg-white border border-black/[0.08] px-2.5 py-0.5 font-mono font-bold text-[#1d1d1f]">
            APPLE10 (-10%)
          </span>
          <span className="text-[#86868b]">·</span>
          <span className="rounded-full bg-white border border-black/[0.08] px-2.5 py-0.5 font-mono font-bold text-[#30d158]">
            APPLE500K (-500k)
          </span>
          <span className="text-[#86868b]">·</span>
          <span className="rounded-full bg-white border border-black/[0.08] px-2.5 py-0.5 font-mono font-bold text-[#0071e3]">
            TECH5 (-5%)
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-11 px-6 text-[14px]"
            onClick={() => {
              document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Khám phá danh mục ↓
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="h-11 px-6 text-[14px]"
            onClick={() => router.push("/admin")}
          >
            Bảng điều khiển quản trị
          </Button>
        </div>

        {/* 3. FEATURE SHOWCASE PANEL (Solid White, No Gradients) */}
        <div className="mx-auto mt-10 max-w-4xl rounded-[22px] border border-black/[0.08] bg-white p-6 sm:p-8 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05),0_14px_40px_rgba(0,0,0,0.05)]">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Kiến trúc ma trận biến thể trực quan
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
            Tự động kết hợp tùy chọn màu sắc, dung lượng và chuẩn thông số thành mã SKU chính xác với transaction locking trên cơ sở dữ liệu MySQL.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => router.push("/products/p-iphone15")}
          >
            Xem thử cấu hình iPhone 15 Pro Max →
          </Button>
        </div>
      </section>

      {/* 4. STOREFRONT CATALOG SECTION */}
      <section id="catalog" className="pt-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Segmented Pill Control */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.03] p-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition active:scale-95",
                selectedCategory === "all"
                  ? "bg-white text-[#1d1d1f] shadow-sm"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              )}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition active:scale-95",
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? "bg-white text-[#1d1d1f] shadow-sm"
                    : "text-[#6e6e73] hover:text-[#1d1d1f]"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="h-9 w-full rounded-full border border-black/[0.08] bg-white pl-9 pr-4 text-xs text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-[#86868b]">
            Đang tải dữ liệu sản phẩm...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[18px] border border-black/[0.08] bg-white py-16 text-center text-sm text-[#86868b]">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
