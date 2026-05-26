"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cartApi } from "@/lib/api/services";
import type { Cart } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function CartPage() {
  const router = useRouter();
  const auth = useRequireAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.accessToken) {
      return;
    }

    const loadCart = async () => {
      setIsLoading(true);
      try {
        const response = await cartApi.getCart(auth.accessToken!);
        setCart(response);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Could not load cart"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadCart();
  }, [auth.accessToken, auth.isAuthenticated]);

  const refreshCart = async () => {
    if (!auth.accessToken) {
      return;
    }
    const updated = await cartApi.getCart(auth.accessToken);
    setCart(updated);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!auth.accessToken) {
      return;
    }
    setBusyItemId(itemId);
    setError(null);
    try {
      await cartApi.updateItem(auth.accessToken, itemId, quantity);
      await refreshCart();
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Could not update quantity"));
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!auth.accessToken) {
      return;
    }
    setBusyItemId(itemId);
    setError(null);
    try {
      await cartApi.removeItem(auth.accessToken, itemId);
      await refreshCart();
    } catch (removeError) {
      setError(getErrorMessage(removeError, "Could not remove item"));
    } finally {
      setBusyItemId(null);
    }
  };

  const clearCart = async () => {
    if (!auth.accessToken) {
      return;
    }
    setError(null);
    try {
      await cartApi.clear(auth.accessToken);
      await refreshCart();
    } catch (clearError) {
      setError(getErrorMessage(clearError, "Could not clear cart"));
    }
  };

  if (!auth.isReady || isLoading) {
    return <Card className="py-14 text-center text-sm text-slate">Loading cart...</Card>;
  }

  const items = cart?.items ?? [];

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Shopping"
        title="Your Cart"
        description="Review quantities before placing your order."
      />

      {error ? <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card> : null}

      {items.length === 0 ? (
        <Card className="space-y-3 py-14 text-center">
          <p className="text-sm text-slate">Your cart is empty.</p>
          <Link href="/" className="text-sm font-semibold text-ink underline">
            Browse products
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-mist">
                    {item.product.primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.primaryImage}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate">No image</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{item.product.name}</p>
                    <p className="text-sm text-slate">{formatCurrency(Number(item.product.price))}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={item.quantity <= 1 || busyItemId === item.id}
                    onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <p className="min-w-9 text-center text-sm font-semibold text-ink">{item.quantity}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={item.quantity >= item.product.stock || busyItemId === item.id}
                    onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <p className="min-w-28 text-right text-sm font-semibold text-ink">
                    {formatCurrency(item.subtotal)}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-700"
                    onClick={() => void removeItem(item.id)}
                    disabled={busyItemId === item.id}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate">Summary</p>
            <div className="space-y-2 text-sm text-slate">
              <div className="flex items-center justify-between">
                <span>Total items</span>
                <span className="font-semibold text-ink">{cart?.totalItems ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total amount</span>
                <span className="text-lg font-black text-ink">
                  {formatCurrency(Number(cart?.totalAmount ?? 0))}
                </span>
              </div>
            </div>
            <Button className="w-full" onClick={() => router.push("/checkout")}>
              Proceed to checkout
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => void clearCart()}>
              Clear cart
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
