"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductFiltersPanel } from "@/components/product/product-filters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getErrorMessage } from "@/lib/api/client";
import { cartApi, categoryApi, productApi } from "@/lib/api/services";
import type { Category, PaginationMeta, ProductFilters, ProductListItem } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const DEFAULT_FILTERS: ProductFilters = {
  page: 1,
  limit: 12,
  sortBy: "newest"
};

export default function HomePage() {
  const router = useRouter();
  const auth = useAuth();

  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        setCategories(response);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Could not load categories"));
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productApi.getProducts(filters);
        setProducts(response.data);
        setMeta(response.meta);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Could not load products"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadProducts();
  }, [filters]);

  const totalValue = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.price || 0), 0),
    [products]
  );
  const averagePrice = useMemo(
    () => (products.length ? totalValue / products.length : 0),
    [products.length, totalValue]
  );
  const totalProducts = meta?.total ?? products.length;

  const handleAddToCart = async (product: ProductListItem) => {
    if (!auth.accessToken) {
      router.push("/login");
      return;
    }

    setIsAdding(product.id);
    setNotice(null);
    try {
      await cartApi.addItem(auth.accessToken, { productId: product.id, quantity: 1 });
      setNotice(`Added "${product.name}" to cart.`);
    } catch (addError) {
      setError(getErrorMessage(addError, "Cannot add this product"));
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-xl2 border border-slate/15 bg-hero-wash p-6 shadow-card sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <p className="animate-reveal text-xs font-black uppercase tracking-[0.24em] text-moss">
              Trending Picks
            </p>
            <h1
              className="animate-reveal font-heading text-4xl font-black leading-tight text-ink sm:text-5xl"
              style={{ animationDelay: "80ms" }}
            >
              Find it. Love it. Own it.
            </h1>
            <p className="animate-reveal max-w-2xl text-base text-slate" style={{ animationDelay: "140ms" }}>
              Fresh arrivals, standout prices, and top-rated essentials picked to move fast.
            </p>
            <div className="animate-reveal flex flex-wrap gap-3" style={{ animationDelay: "210ms" }}>
              <Button onClick={() => router.push("/cart")}>Open Cart</Button>
              <Button variant="ghost" onClick={() => router.push("/orders")}>
                Track Orders
              </Button>
            </div>
            <div
              className="animate-reveal grid gap-2 pt-1 sm:grid-cols-3"
              style={{ animationDelay: "280ms" }}
            >
              <div className="rounded-xl border border-slate/20 bg-cloud/75 px-3 py-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate">Total Picks</p>
                <p className="text-sm font-semibold text-ink">{totalProducts} ready to shop</p>
              </div>
              <div className="rounded-xl border border-slate/20 bg-cloud/75 px-3 py-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate">Average Price</p>
                <p className="text-sm font-semibold text-ink">{formatCurrency(averagePrice)}</p>
              </div>
              <div className="rounded-xl border border-slate/20 bg-cloud/75 px-3 py-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate">Shop Variety</p>
                <p className="text-sm font-semibold text-ink">{categories.length} categories to explore</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="animate-drift bg-cloud/85">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">Trending Now</p>
              <p className="font-heading text-3xl font-black text-ink">{products.length}</p>
              <p className="text-sm text-slate">hot products on this page</p>
            </Card>
            <Card className="animate-rise bg-cloud/85">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">Cart Potential</p>
              <p className="font-heading text-3xl font-black text-ink">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-slate">total value of current picks</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="animate-reveal" style={{ animationDelay: "60ms" }}>
          <ProductFiltersPanel
            filters={draftFilters}
            categories={categories}
            onChange={setDraftFilters}
            onApply={() => setFilters({ ...draftFilters, page: 1 })}
            onReset={() => {
              setDraftFilters(DEFAULT_FILTERS);
              setFilters(DEFAULT_FILTERS);
            }}
          />
        </div>

        <div className="space-y-4">
          <SectionHeading
            eyebrow="Catalog"
            title="Products"
            description="Search, filter, and add products directly to cart."
            rightSlot={
              meta ? (
                <p className="text-sm font-semibold text-slate">
                  Page {meta.page} / {Math.max(meta.totalPages, 1)} ({meta.total} items)
                </p>
              ) : null
            }
          />

          {notice ? (
            <Card className="border-emerald-200 bg-emerald-50 py-3 text-sm text-emerald-800">{notice}</Card>
          ) : null}

          {error ? (
            <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card>
          ) : null}

          {isLoading ? (
            <Card className="py-14 text-center text-sm text-slate">Loading products...</Card>
          ) : products.length === 0 ? (
            <Card className="py-14 text-center text-sm text-slate">
              No products found with current filters.
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={`animate-reveal ${isAdding === product.id ? "opacity-70" : ""}`}
                  style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
                >
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 rounded-xl2 border border-slate/20 bg-cloud p-3">
              <Button
                variant="ghost"
                disabled={meta.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
              >
                Previous
              </Button>
              <p className="text-sm font-semibold text-slate">
                Page {meta.page} of {meta.totalPages}
              </p>
              <Button
                variant="ghost"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
