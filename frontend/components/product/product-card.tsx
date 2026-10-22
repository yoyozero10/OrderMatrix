import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProductListItem } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  product: ProductListItem;
  onAddToCart?: (product: ProductListItem) => void;
};

export function ProductCard({ product }: ProductCardProps) {
  const displayPrice = product.basePrice ?? product.price ?? 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] bg-white border border-black/[0.08] rounded-[18px]">
      <Link href={`/products/${product.id}`} className="block overflow-hidden bg-[#fbfbfd]">
        <div className="relative aspect-[4/3] w-full overflow-hidden flex items-center justify-center p-4">
          {product.primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primaryImage}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-medium text-[#86868b]">
              Chưa có hình ảnh
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {/* Category & Color Swatches */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            {product.category?.name ?? "Thiết bị"}
          </div>

          {/* Available Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5" title={`${product.colors.length} màu sắc có sẵn`}>
              {product.colors.map((color, idx) => (
                <span
                  key={idx}
                  className="h-2.5 w-2.5 rounded-full border border-black/15 shadow-inner transition-transform hover:scale-125"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        <Link href={`/products/${product.id}`}>
          <h3 className="mt-1.5 line-clamp-1 text-[15px] font-bold tracking-tight text-[#1d1d1f] transition group-hover:text-[#0071e3]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#6e6e73]">
          {product.description || "Sản phẩm công nghệ cao cấp chính hãng OrderMatrix."}
        </p>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-black/[0.06]">
          <div>
            <div className="text-[11px] font-medium text-[#86868b]">Giá từ</div>
            <div className="text-[16px] font-bold tracking-tight text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
              {formatCurrency(displayPrice)}
            </div>
          </div>
          <Link href={`/products/${product.id}`}>
            <Button size="sm" variant="secondary" className="text-xs rounded-full px-3.5">
              Cấu hình →
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
