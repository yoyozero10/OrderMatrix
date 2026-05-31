import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProductListItem } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  product: ProductListItem;
  onAddToCart?: (product: ProductListItem) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="group flex h-full flex-col p-0 transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-44 overflow-hidden rounded-t-[1.25rem] bg-mist">
          {product.primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primaryImage}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-slate">
              No image
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="line-clamp-1 text-xs font-bold uppercase tracking-[0.16em] text-moss">
            {product.category?.name ?? "Uncategorized"}
          </p>
          <h3 className="mt-1 line-clamp-2 font-heading text-lg font-bold text-ink">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-slate">{product.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-black text-ink">{formatCurrency(product.price)}</p>
            <p className="text-xs text-slate">Stock: {product.stock}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => onAddToCart?.(product)}>
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
