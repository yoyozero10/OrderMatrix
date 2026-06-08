"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getErrorMessage } from "@/lib/api/client";
import { cartApi, productApi } from "@/lib/api/services";
import type { ProductDetail } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();

  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productApi.getProductById(productId);
        setProduct(response);
      } catch (err) {
        setError(getErrorMessage(err, "Could not load product details"));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!auth.accessToken) {
      router.push("/login");
      return;
    }

    setIsAdding(true);
    setError(null);
    setNotice(null);
    try {
      await cartApi.addItem(auth.accessToken, { productId: product.id, quantity });
      setNotice(`Added ${quantity} "${product.name}" to cart.`);
    } catch (err) {
      setError(getErrorMessage(err, "Cannot add product to cart"));
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return <Card className="py-14 text-center text-sm text-slate">Loading product details...</Card>;
  }

  if (error && !product) {
    return (
      <div className="space-y-4">
        <Card className="border-rose-200 bg-rose-50 py-4 text-center text-sm text-rose-700">{error}</Card>
        <Button onClick={() => router.push("/")}>Back to Catalog</Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Card className="py-14 text-center text-sm text-slate">Product not found</Card>
        <Button onClick={() => router.push("/")}>Back to Catalog</Button>
      </div>
    );
  }

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          &larr; Back to Catalog
        </Button>
      </div>

      {notice && (
        <Card className="border-emerald-200 bg-emerald-50 py-3 text-sm text-emerald-800">{notice}</Card>
      )}

      {error && (
        <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card>
      )}

      <Card className="p-6">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
          {/* Product Image */}
          <div className="flex items-center justify-center rounded-xl border border-slate/15 bg-cloud/50 p-4 h-[300px] md:h-[400px] overflow-hidden">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage.imageUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-slate text-sm font-semibold">No Image Available</div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-moss/10 text-moss uppercase tracking-wider">
                {product.category?.name || "General"}
              </span>
              <h1 className="font-heading text-3xl font-black text-ink leading-tight">{product.name}</h1>
              <p className="text-2xl font-bold text-ink">{formatCurrency(product.price)}</p>
              
              <div className="border-t border-slate/10 pt-4">
                <h3 className="text-sm font-bold text-slate uppercase tracking-wider mb-2">Description</h3>
                <p className="text-slate text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate/10 pt-4">
              <div className="flex items-center justify-between text-sm text-slate">
                <span>Availability:</span>
                <span className={`font-semibold ${product.stock > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} items)` : "Out of Stock"}
                </span>
              </div>

              {product.stock > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate/20 rounded-xl bg-cloud px-3 py-1">
                    <button
                      type="button"
                      className="text-lg font-bold text-slate hover:text-ink px-2"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      -
                    </button>
                    <span className="font-semibold text-ink px-4 min-w-[40px] text-center">{quantity}</span>
                    <button
                      type="button"
                      className="text-lg font-bold text-slate hover:text-ink px-2"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    >
                      +
                    </button>
                  </div>

                  <Button
                    className="flex-1"
                    disabled={isAdding}
                    onClick={() => void handleAddToCart()}
                  >
                    {isAdding ? "Adding to Cart..." : "Add to Cart"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
