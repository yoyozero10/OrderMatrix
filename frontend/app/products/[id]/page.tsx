"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api/client";
import { cartApi, productApi } from "@/lib/api/services";
import type { ProductDetail, ProductOption, ProductOptionValue, ProductVariantItem } from "@/lib/api/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

// Rich fallback demo products for offline / local showcase
const DEMO_PRODUCTS: Record<string, ProductDetail> = {
  "p-iphone15": {
    id: "p-iphone15",
    name: "iPhone 15 Pro Max",
    description: "Khung viền Titanium nguyên khối siêu nhẹ chuẩn hàng không vũ trụ, chip Apple A17 Pro mạnh mẽ, camera zoom quang học 5x sắc nét và cổng kết nối USB-C chuẩn 3.0 tốc độ cao.",
    basePrice: 29990000,
    price: 29990000,
    stock: 45,
    status: "active",
    category: { id: "c-1", name: "Điện thoại" },
    images: [
      { id: "img-ip-1", imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800", isPrimary: true, displayOrder: 0 },
      { id: "img-ip-2", imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800", isPrimary: false, displayOrder: 1 },
      { id: "img-ip-3", imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800", isPrimary: false, displayOrder: 2 },
      { id: "img-ip-4", imageUrl: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800", isPrimary: false, displayOrder: 3 }
    ],
    options: [
      {
        id: "opt-color-ip",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-nat", value: "Titan Tự Nhiên", colorCode: "#9c958d", imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800", displayOrder: 0 },
          { id: "c-blu", value: "Titan Xanh", colorCode: "#3b4454", imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800", displayOrder: 1 },
          { id: "c-wht", value: "Titan Trắng", colorCode: "#e3e4e5", imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800", displayOrder: 2 },
          { id: "c-blk", value: "Titan Đen", colorCode: "#242527", imageUrl: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800", displayOrder: 3 }
        ]
      },
      {
        id: "opt-storage-ip",
        name: "Dung lượng",
        displayOrder: 1,
        values: [
          { id: "s-256", value: "256GB", displayOrder: 0 },
          { id: "s-512", value: "512GB", displayOrder: 1 },
          { id: "s-1tb", value: "1TB", displayOrder: 2 }
        ]
      }
    ],
    variants: [
      { id: "v-ip-1", sku: "IP15PM-NAT-256", price: 29990000, stock: 15, status: "active", imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800", optionValues: [{ optionType: "Màu sắc", value: "Titan Tự Nhiên" }, { optionType: "Dung lượng", value: "256GB" }] },
      { id: "v-ip-2", sku: "IP15PM-NAT-512", price: 34990000, stock: 10, status: "active", imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800", optionValues: [{ optionType: "Màu sắc", value: "Titan Tự Nhiên" }, { optionType: "Dung lượng", value: "512GB" }] },
      { id: "v-ip-3", sku: "IP15PM-BLU-256", price: 29990000, stock: 12, status: "active", imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800", optionValues: [{ optionType: "Màu sắc", value: "Titan Xanh" }, { optionType: "Dung lượng", value: "256GB" }] },
      { id: "v-ip-4", sku: "IP15PM-WHT-256", price: 29990000, stock: 8, status: "active", imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800", optionValues: [{ optionType: "Màu sắc", value: "Titan Trắng" }, { optionType: "Dung lượng", value: "256GB" }] },
      { id: "v-ip-5", sku: "IP15PM-BLK-256", price: 29990000, stock: 10, status: "active", imageUrl: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800", optionValues: [{ optionType: "Màu sắc", value: "Titan Đen" }, { optionType: "Dung lượng", value: "256GB" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  "p-macbookpro": {
    id: "p-macbookpro",
    name: "MacBook Pro 16 inch M3 Max",
    description: "Hiệu năng đồ họa đỉnh cao, màn hình Liquid Retina XDR sáng 1600 nits, RAM 36GB thống nhất và thời lượng pin lên đến 22 giờ liên tục.",
    basePrice: 64990000,
    price: 64990000,
    stock: 20,
    status: "active",
    category: { id: "c-2", name: "Laptop" },
    images: [
      { id: "img-mb-1", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", isPrimary: true, displayOrder: 0 },
      { id: "img-mb-2", imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800", isPrimary: false, displayOrder: 1 },
      { id: "img-mb-3", imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800", isPrimary: false, displayOrder: 2 }
    ],
    options: [
      {
        id: "opt-color-mb",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-blk-mb", value: "Space Black", colorCode: "#2e3033", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", displayOrder: 0 },
          { id: "c-slv-mb", value: "Silver", colorCode: "#e0e2e5", imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800", displayOrder: 1 }
        ]
      },
      {
        id: "opt-ram-mb",
        name: "Bộ nhớ RAM",
        displayOrder: 1,
        values: [
          { id: "r-36", value: "36GB", displayOrder: 0 },
          { id: "r-48", value: "48GB", displayOrder: 1 }
        ]
      }
    ],
    variants: [
      { id: "v-mb-1", sku: "MBP16-BLK-36", price: 64990000, stock: 10, status: "active", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", optionValues: [{ optionType: "Màu sắc", value: "Space Black" }, { optionType: "Bộ nhớ RAM", value: "36GB" }] },
      { id: "v-mb-2", sku: "MBP16-SLV-36", price: 64990000, stock: 10, status: "active", imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800", optionValues: [{ optionType: "Màu sắc", value: "Silver" }, { optionType: "Bộ nhớ RAM", value: "36GB" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  "p-ipadpro": {
    id: "p-ipadpro",
    name: "iPad Pro 13 inch M4",
    description: "Thiết kế siêu mỏng 5.1mm, màn hình Ultra Retina XDR công nghệ OLED 2 lớp tân tiến, chip Apple M4 bứt phá mọi giới hạn sáng tạo.",
    basePrice: 37990000,
    price: 37990000,
    stock: 35,
    status: "active",
    category: { id: "c-3", name: "Máy tính bảng" },
    images: [
      { id: "img-pad-1", imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800", isPrimary: true, displayOrder: 0 },
      { id: "img-pad-2", imageUrl: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800", isPrimary: false, displayOrder: 1 }
    ],
    options: [
      {
        id: "opt-color-pad",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-blk-pad", value: "Space Black", colorCode: "#2e3033", imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800", displayOrder: 0 },
          { id: "c-slv-pad", value: "Silver", colorCode: "#e0e2e5", imageUrl: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800", displayOrder: 1 }
        ]
      },
      {
        id: "opt-storage-pad",
        name: "Dung lượng",
        displayOrder: 1,
        values: [
          { id: "s-256-pad", value: "256GB", displayOrder: 0 },
          { id: "s-512-pad", value: "512GB", displayOrder: 1 }
        ]
      }
    ],
    variants: [
      { id: "v-pad-1", sku: "IPAD13-BLK-256", price: 37990000, stock: 20, status: "active", imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800", optionValues: [{ optionType: "Màu sắc", value: "Space Black" }, { optionType: "Dung lượng", value: "256GB" }] },
      { id: "v-pad-2", sku: "IPAD13-SLV-256", price: 37990000, stock: 15, status: "active", imageUrl: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800", optionValues: [{ optionType: "Màu sắc", value: "Silver" }, { optionType: "Dung lượng", value: "256GB" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  "p-applewatch": {
    id: "p-applewatch",
    name: "Apple Watch Ultra 2",
    description: "Vỏ Titanium 49mm chống va đập chuẩn quân sự, màn hình độ sáng 3000 nits, GPS tần số kép siêu chính xác, khả năng lặn sâu 40 mét.",
    basePrice: 21990000,
    price: 21990000,
    stock: 50,
    status: "active",
    category: { id: "c-4", name: "Phụ kiện" },
    images: [
      { id: "img-aw-1", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", isPrimary: true, displayOrder: 0 },
      { id: "img-aw-2", imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800", isPrimary: false, displayOrder: 1 }
    ],
    options: [
      {
        id: "opt-strap-aw",
        name: "Dây đeo",
        displayOrder: 0,
        values: [
          { id: "st-alp", value: "Cam Alpine Loop", colorCode: "#e88038", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", displayOrder: 0 },
          { id: "st-trl", value: "Xanh Trail Loop", colorCode: "#2c4059", imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800", displayOrder: 1 },
          { id: "st-tit", value: "Titan Tự Nhiên", colorCode: "#d4d5d9", displayOrder: 2 }
        ]
      }
    ],
    variants: [
      { id: "v-aw-1", sku: "AWU2-ALP-49", price: 21990000, stock: 25, status: "active", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", optionValues: [{ optionType: "Dây đeo", value: "Cam Alpine Loop" }] },
      { id: "v-aw-2", sku: "AWU2-TRL-49", price: 21990000, stock: 25, status: "active", imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800", optionValues: [{ optionType: "Dây đeo", value: "Xanh Trail Loop" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();

  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const setupProductData = (prod: ProductDetail) => {
    setProduct(prod);

    const primary =
      prod.images?.find((img) => img.isPrimary)?.imageUrl ||
      prod.images?.[0]?.imageUrl ||
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800";

    const groups = prod.options || prod.optionTypes || [];
    if (groups.length) {
      const init: Record<string, string> = {};
      let initialImg = primary;

      groups.forEach((ot) => {
        if (ot.values?.length) {
          init[ot.name] = ot.values[0].value;
          // If first option has custom image, select it
          if (ot.values[0].imageUrl && initialImg === primary) {
            initialImg = ot.values[0].imageUrl;
          }
        }
      });
      setSelectedOptions(init);
      setActiveImage(initialImg);
    } else {
      setActiveImage(primary);
    }
  };

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productApi.getProductById(productId);
        setupProductData(response);
      } catch {
        // Fallback demo product
        const fallback = DEMO_PRODUCTS[productId] || DEMO_PRODUCTS["p-iphone15"];
        if (fallback) {
          setupProductData(fallback);
        } else {
          setError("Không thể tải thông tin sản phẩm");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProduct();
  }, [productId]);

  const optionGroups: ProductOption[] = useMemo(() => {
    return product?.options || product?.optionTypes || [];
  }, [product]);

  // Find variant matching current options
  const matchedVariant: ProductVariantItem | null = useMemo(() => {
    if (!product?.variants?.length) return null;
    return (
      product.variants.find((v) => {
        if (!v.optionValues?.length) return false;
        return v.optionValues.every(
          (ov) => selectedOptions[ov.optionType] === ov.value
        );
      }) || product.variants[0]
    );
  }, [product, selectedOptions]);

  const currentPrice = matchedVariant ? matchedVariant.price : (product?.basePrice ?? product?.price ?? 0);
  const currentStock = matchedVariant ? matchedVariant.stock : (product?.stock ?? 0);
  const currentSku = matchedVariant ? matchedVariant.sku : "SKU-BASE";

  // Build complete list of images for thumbnail gallery
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];

    // 1. Product images in order
    if (product.images?.length) {
      const sorted = [...product.images].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      );
      sorted.forEach((img) => {
        if (img.imageUrl && !list.includes(img.imageUrl)) {
          list.push(img.imageUrl);
        }
      });
    }

    // 2. Add images from option values (e.g. color variants)
    optionGroups.forEach((group) => {
      group.values?.forEach((val) => {
        if (val.imageUrl && !list.includes(val.imageUrl)) {
          list.push(val.imageUrl);
        }
      });
    });

    // 3. Add images from variants
    product.variants?.forEach((v) => {
      if (v.imageUrl && !list.includes(v.imageUrl)) {
        list.push(v.imageUrl);
      }
    });

    // 4. Ensure activeImage is included
    if (activeImage && !list.includes(activeImage)) {
      list.push(activeImage);
    }

    return list;
  }, [product, optionGroups, activeImage]);

  // Handle option selection with automatic image switching
  const handleSelectOption = (groupName: string, val: ProductOptionValue) => {
    const nextOptions = { ...selectedOptions, [groupName]: val.value };
    setSelectedOptions(nextOptions);

    // 1. Direct OptionValue imageUrl
    if (val.imageUrl) {
      setActiveImage(val.imageUrl);
      return;
    }

    // 2. Matched variant imageUrl
    if (product?.variants?.length) {
      const nextMatched = product.variants.find((v) => {
        if (!v.optionValues?.length) return false;
        return v.optionValues.every(
          (ov) => nextOptions[ov.optionType] === ov.value
        );
      });
      if (nextMatched?.imageUrl) {
        setActiveImage(nextMatched.imageUrl);
        return;
      }
    }

    // 3. Fallback: match by option value name in product images
    if (product?.images?.length) {
      const matchImg = product.images.find((img) =>
        img.imageUrl.toLowerCase().includes(val.value.toLowerCase())
      );
      if (matchImg) {
        setActiveImage(matchImg.imageUrl);
      }
    }
  };

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
      await cartApi.addItem(auth.accessToken, {
        variantId: matchedVariant?.id,
        productId: product.id,
        quantity
      });
      setNotice(`Đã thêm ${quantity} x "${product.name}" (${currentSku}) vào giỏ hàng.`);
      setTimeout(() => router.push("/cart"), 600);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể thêm sản phẩm vào túi hàng"));
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="py-20 text-center text-sm text-[#86868b] bg-white border border-black/[0.08] rounded-[18px]">
        Đang tải thông tin cấu hình sản phẩm...
      </Card>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-[#86868b]">Không tìm thấy thông tin sản phẩm.</p>
        <Link href="/">
          <Button size="sm">Quay lại danh mục</Button>
        </Link>
      </div>
    );
  }

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800";

  const currentDisplayImage = activeImage || primaryImage;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition">
          ← Danh mục sản phẩm
        </Link>
      </div>

      {notice && (
        <Card className="border-[#30d158]/20 bg-[#30d158]/5 py-3 px-4 text-xs font-semibold text-[#30d158]">
          {notice}
        </Card>
      )}

      {error && (
        <Card className="border-[#ff3b30]/20 bg-[#ff3b30]/5 py-3 px-4 text-xs font-semibold text-[#ff3b30]">
          {error}
        </Card>
      )}

      <Card className="p-6 sm:p-8 bg-white border border-black/[0.08] rounded-[22px]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* Gallery View — Apple Liquid Glass */}
          <div className="flex flex-col space-y-4">
            {/* Main Showcase Image */}
            <div className="relative flex items-center justify-center rounded-[20px] bg-[#fbfbfd] border border-black/[0.06] p-8 min-h-[360px] sm:min-h-[460px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentDisplayImage}
                alt={product.name}
                key={currentDisplayImage}
                className="max-h-[380px] w-auto max-w-full object-contain transition-all duration-300 hover:scale-105"
              />
            </div>

            {/* Thumbnail Gallery Bar */}
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1 px-1">
                {galleryImages.map((imgUrl, index) => {
                  const isCurrent = currentDisplayImage === imgUrl;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImage(imgUrl)}
                      className={cn(
                        "relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-[14px] bg-[#fbfbfd] p-1.5 transition-all duration-200 active:scale-95",
                        isCurrent
                          ? "border-transparent ring-2 ring-[#0071e3] ring-offset-2 shadow-sm opacity-100"
                          : "border border-black/[0.08] opacity-70 hover:opacity-100 hover:border-black/20"
                      )}
                      aria-label={`Xem hình ảnh ${index + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`${product.name} góc chụp ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Configuration Form */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                {product.category?.name || "Thiết bị"}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
                {product.name}
              </h1>

              <div className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] [font-variant-numeric:tabular-nums]">
                {formatCurrency(currentPrice)}
              </div>

              {/* SKU & Stock Info */}
              <div className="flex items-center justify-between rounded-[12px] bg-black/[0.03] px-3.5 py-2 text-xs">
                <span className="font-mono text-[#6e6e73]">SKU: {currentSku}</span>
                <span className={`font-semibold ${currentStock > 0 ? "text-[#30d158]" : "text-[#ff3b30]"}`}>
                  {currentStock > 0 ? `Còn hàng (${currentStock})` : "Hết hàng"}
                </span>
              </div>

              {/* Promotional Voucher Banner */}
              <div className="rounded-[14px] border border-[#0071e3]/20 bg-[#0071e3]/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0071e3]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <span>Ưu đãi thanh toán độc quyền</span>
                  </div>
                  <span className="text-[10px] text-[#6e6e73]">Tự động áp dụng tại giỏ hàng</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1 shadow-sm text-xs">
                    <span className="font-mono font-bold text-[#0071e3]">APPLE10</span>
                    <span className="text-[#1d1d1f] text-[11px]">Giảm 10% (tối đa 2.000.000 ₫)</span>
                  </div>
                  {currentPrice >= 10000000 && (
                    <div className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1 shadow-sm text-xs">
                      <span className="font-mono font-bold text-[#30d158]">APPLE500K</span>
                      <span className="text-[#1d1d1f] text-[11px]">Giảm 500.000 ₫</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Option Groups (Màu sắc, Dung lượng, Dây đeo...) */}
              {optionGroups.length > 0 && (
                <div className="space-y-4 pt-2">
                  {optionGroups.map((ot) => {
                    const isColorGroup =
                      ot.name.toLowerCase().includes("màu") ||
                      ot.name.toLowerCase().includes("color") ||
                      ot.name.toLowerCase().includes("dây") ||
                      ot.values?.some((v) => !!v.colorCode);

                    return (
                      <div key={ot.id} className="space-y-2.5 pt-2 border-t border-black/[0.06]">
                        <div className="text-xs font-semibold text-[#1d1d1f]">
                          {ot.name}:{" "}
                          <span className="font-normal text-[#6e6e73]">
                            {selectedOptions[ot.name] || "Chưa chọn"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2.5 items-center">
                          {ot.values?.map((val) => {
                            const isSelected = selectedOptions[ot.name] === val.value;

                            // Color Option with Apple Swatch Dot & Ring Effect
                            if (isColorGroup && val.colorCode) {
                              return (
                                <button
                                  key={val.id}
                                  type="button"
                                  onClick={() => handleSelectOption(ot.name, val)}
                                  title={val.value}
                                  className={cn(
                                    "group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
                                    isSelected
                                      ? "bg-white text-[#1d1d1f] shadow-sm ring-2 ring-[#0071e3] ring-offset-2 border border-black/10"
                                      : "border border-black/[0.1] bg-white text-[#1d1d1f] hover:bg-black/[0.03] hover:border-black/20"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-3.5 w-3.5 rounded-full border border-black/15 shrink-0 transition-transform shadow-inner",
                                      isSelected ? "scale-110" : "group-hover:scale-105"
                                    )}
                                    style={{ backgroundColor: val.colorCode }}
                                  />
                                  <span className={isSelected ? "font-semibold" : "font-normal"}>
                                    {val.value}
                                  </span>
                                </button>
                              );
                            }

                            // Standard Pill Button Option with Apple Ring Effect
                            return (
                              <button
                                key={val.id}
                                type="button"
                                onClick={() => handleSelectOption(ot.name, val)}
                                className={cn(
                                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
                                  isSelected
                                    ? "bg-[#0071e3] text-white shadow-sm ring-2 ring-[#0071e3] ring-offset-2"
                                    : "border border-black/[0.1] bg-white text-[#1d1d1f] hover:bg-black/[0.03] hover:border-black/20"
                                )}
                              >
                                {val.colorCode && (
                                  <span
                                    className="h-3 w-3 rounded-full border border-black/10 shrink-0 shadow-inner"
                                    style={{ backgroundColor: val.colorCode }}
                                  />
                                )}
                                <span>{val.value}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                <div className="text-xs font-semibold text-[#1d1d1f]">Số lượng</div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 rounded-full"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </Button>
                  <input
                    type="number"
                    readOnly
                    value={quantity}
                    className="h-8 w-12 rounded-[10px] border border-black/[0.1] bg-black/[0.03] text-center text-xs font-bold text-[#1d1d1f]"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 rounded-full"
                    disabled={quantity >= currentStock}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-black/[0.06] pt-3 text-xs leading-relaxed text-[#6e6e73]">
                <p>{product.description}</p>
              </div>
            </div>

            <Button
              size="lg"
              disabled={isAdding || currentStock <= 0}
              onClick={() => void handleAddToCart()}
              className="w-full text-sm font-semibold mt-4 rounded-full h-11"
            >
              {isAdding ? "Đang thêm vào túi..." : currentStock > 0 ? "Thêm vào túi hàng" : "Hết hàng"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
