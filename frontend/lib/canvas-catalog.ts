import type { ProductDetail } from "@/lib/api/types";

export const CANVAS_CATALOG: ProductDetail[] = [
  {
    id: "p-mbp-16",
    name: "MacBook Pro 16 M3 Max",
    description: "Hiệu năng đồ họa đỉnh cao, màn hình Liquid Retina XDR sáng 1600 nits, chip M3 Max 16-core CPU, 40-core GPU.",
    basePrice: 64990000,
    price: 64990000,
    stock: 20,
    status: "active",
    category: { id: "c-mac", name: "Laptop" },
    images: [
      { id: "img-mb-1", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", isPrimary: true, displayOrder: 0 },
      { id: "img-mb-2", imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800", isPrimary: false, displayOrder: 1 }
    ],
    options: [
      {
        id: "opt-color-mbp",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-mb-blk", value: "Space Black", colorCode: "#2e3033", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", displayOrder: 0 },
          { id: "c-mb-slv", value: "Silver", colorCode: "#e0e2e5", imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800", displayOrder: 1 }
        ]
      },
      {
        id: "opt-ram-mbp",
        name: "Bộ nhớ RAM",
        displayOrder: 1,
        values: [
          { id: "r-36", value: "36GB RAM", displayOrder: 0 },
          { id: "r-48", value: "48GB RAM", displayOrder: 1 }
        ]
      }
    ],
    variants: [
      { id: "v-mbp-blk-36", sku: "MBP16-BLK-36", price: 64990000, stock: 12, status: "active", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", optionValues: [{ optionType: "Màu sắc", value: "Space Black" }, { optionType: "Bộ nhớ RAM", value: "36GB RAM" }] },
      { id: "v-mbp-slv-36", sku: "MBP16-SLV-36", price: 64990000, stock: 8, status: "active", imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800", optionValues: [{ optionType: "Màu sắc", value: "Silver" }, { optionType: "Bộ nhớ RAM", value: "36GB RAM" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "p-mba-15",
    name: "MacBook Air 15 M3",
    description: "Siêu mỏng nhẹ 11.5mm, thời lượng pin 18 giờ, màn hình Liquid Retina 15.3 inch rực rỡ và chip Apple M3 mạnh mẽ.",
    basePrice: 32990000,
    price: 32990000,
    stock: 25,
    status: "active",
    category: { id: "c-mac", name: "Laptop" },
    images: [
      { id: "img-mba-1", imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800", isPrimary: true, displayOrder: 0 }
    ],
    options: [
      {
        id: "opt-color-mba",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-mba-mid", value: "Midnight", colorCode: "#19232d", imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800", displayOrder: 0 },
          { id: "c-mba-sta", value: "Starlight", colorCode: "#f0e4d3", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", displayOrder: 1 },
          { id: "c-mba-slv", value: "Silver", colorCode: "#e0e2e5", imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800", displayOrder: 2 }
        ]
      }
    ],
    variants: [
      { id: "v-mba-mid-256", sku: "MBA15-MID-256", price: 32990000, stock: 15, status: "active", imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800", optionValues: [{ optionType: "Màu sắc", value: "Midnight" }] },
      { id: "v-mba-sta-256", sku: "MBA15-STA-256", price: 32990000, stock: 10, status: "active", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", optionValues: [{ optionType: "Màu sắc", value: "Starlight" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "p-ipad-pro",
    name: "iPad Pro 13 inch M4",
    description: "Đột phá thiết kế mỏng 5.1mm, màn hình Ultra Retina XDR công nghệ OLED kép 2 lớp, hiệu năng chip Apple M4 hàng đầu.",
    basePrice: 37990000,
    price: 37990000,
    stock: 30,
    status: "active",
    category: { id: "c-ipad", name: "Máy tính bảng" },
    images: [
      { id: "img-pad-1", imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800", isPrimary: true, displayOrder: 0 }
    ],
    options: [
      {
        id: "opt-color-pad",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-pad-blk", value: "Space Black", colorCode: "#2e3033", imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800", displayOrder: 0 },
          { id: "c-pad-slv", value: "Silver", colorCode: "#e0e2e5", imageUrl: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800", displayOrder: 1 }
        ]
      }
    ],
    variants: [
      { id: "v-pad-blk-256", sku: "IPAD13-BLK-256", price: 37990000, stock: 18, status: "active", imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800", optionValues: [{ optionType: "Màu sắc", value: "Space Black" }] },
      { id: "v-pad-slv-256", sku: "IPAD13-SLV-256", price: 37990000, stock: 12, status: "active", imageUrl: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800", optionValues: [{ optionType: "Màu sắc", value: "Silver" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "p-iphone-16",
    name: "iPhone 16 Pro Max",
    description: "Khung viền Titan sa mạc đẳng cấp, chip A18 Pro tiến trình 3nm thế hệ mới, nút Camera Control xúc giác chuyên nghiệp.",
    basePrice: 34990000,
    price: 34990000,
    stock: 40,
    status: "active",
    category: { id: "c-phone", name: "Điện thoại" },
    images: [
      { id: "img-ip16-1", imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800", isPrimary: true, displayOrder: 0 }
    ],
    options: [
      {
        id: "opt-color-ip16",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-16-des", value: "Desert Titanium", colorCode: "#bfa38b", imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800", displayOrder: 0 },
          { id: "c-16-nat", value: "Natural Titanium", colorCode: "#9c958d", imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800", displayOrder: 1 },
          { id: "c-16-blk", value: "Black Titanium", colorCode: "#242527", imageUrl: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800", displayOrder: 2 }
        ]
      }
    ],
    variants: [
      { id: "v-ip16-des-256", sku: "IP16PM-DES-256", price: 34990000, stock: 20, status: "active", imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800", optionValues: [{ optionType: "Màu sắc", value: "Desert Titanium" }] },
      { id: "v-ip16-nat-256", sku: "IP16PM-NAT-256", price: 34990000, stock: 15, status: "active", imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800", optionValues: [{ optionType: "Màu sắc", value: "Natural Titanium" }] },
      { id: "v-ip16-blk-256", sku: "IP16PM-BLK-256", price: 34990000, stock: 10, status: "active", imageUrl: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800", optionValues: [{ optionType: "Màu sắc", value: "Black Titanium" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "p-watch-ultra",
    name: "Apple Watch Ultra 2",
    description: "Vỏ Titanium 49mm chống va đập chuẩn quân sự, màn hình độ sáng 3000 nits, GPS tần số kép siêu chính xác.",
    basePrice: 21990000,
    price: 21990000,
    stock: 25,
    status: "active",
    category: { id: "c-watch", name: "Đồng hồ" },
    images: [
      { id: "img-awu-1", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", isPrimary: true, displayOrder: 0 }
    ],
    options: [
      {
        id: "opt-strap-awu",
        name: "Dây đeo",
        displayOrder: 0,
        values: [
          { id: "st-alp-awu", value: "Cam Alpine Loop", colorCode: "#e88038", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", displayOrder: 0 },
          { id: "st-trl-awu", value: "Xanh Trail Loop", colorCode: "#2c4059", imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800", displayOrder: 1 }
        ]
      }
    ],
    variants: [
      { id: "v-awu-alp", sku: "AWU2-ALP-49", price: 21990000, stock: 15, status: "active", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", optionValues: [{ optionType: "Dây đeo", value: "Cam Alpine Loop" }] },
      { id: "v-awu-trl", sku: "AWU2-TRL-49", price: 21990000, stock: 10, status: "active", imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800", optionValues: [{ optionType: "Dây đeo", value: "Xanh Trail Loop" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "p-airpods-pro",
    name: "AirPods Pro 2 (USB-C)",
    description: "Chống ồn chủ động ANC gấp 2 lần, âm thanh thích ứng Adaptive Audio, cổng sạc USB-C và chuẩn chống nước IP54.",
    basePrice: 5990000,
    price: 5990000,
    stock: 50,
    status: "active",
    category: { id: "c-audio", name: "Âm thanh" },
    images: [
      { id: "img-app-1", imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800", isPrimary: true, displayOrder: 0 }
    ],
    options: [
      {
        id: "opt-color-app",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-app-wht", value: "Trắng Bóng", colorCode: "#ffffff", imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800", displayOrder: 0 }
        ]
      }
    ],
    variants: [
      { id: "v-app-wht", sku: "APP2-USBC", price: 5990000, stock: 50, status: "active", imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800", optionValues: [{ optionType: "Màu sắc", value: "Trắng Bóng" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "p-airpods-max",
    name: "AirPods Max",
    description: "Tai nghe over-ear cao cấp với âm thanh Spatial Audio sống động như tại rạp hát, khung nhôm nguyên khối anodized tinh tế.",
    basePrice: 13990000,
    price: 13990000,
    stock: 18,
    status: "active",
    category: { id: "c-audio", name: "Âm thanh" },
    images: [
      { id: "img-apm-1", imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800", isPrimary: true, displayOrder: 0 }
    ],
    options: [
      {
        id: "opt-color-apm",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-apm-blk", value: "Space Gray", colorCode: "#323337", imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800", displayOrder: 0 },
          { id: "c-apm-slv", value: "Silver", colorCode: "#e2e4e8", imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800", displayOrder: 1 }
        ]
      }
    ],
    variants: [
      { id: "v-apm-blk", sku: "APM-BLK", price: 13990000, stock: 10, status: "active", imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800", optionValues: [{ optionType: "Màu sắc", value: "Space Gray" }] },
      { id: "v-apm-slv", sku: "APM-SLV", price: 13990000, stock: 8, status: "active", imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800", optionValues: [{ optionType: "Màu sắc", value: "Silver" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "p-adapter-20w",
    name: "Củ sạc nhanh Apple 20W USB-C",
    description: "Củ sạc công suất 20W chính hãng Apple, tối ưu cho iPhone và iPad, sạc 50% pin chỉ trong 30 phút.",
    basePrice: 549000,
    price: 549000,
    stock: 60,
    status: "active",
    category: { id: "c-acc", name: "Phụ kiện" },
    images: [
      { id: "img-ad-1", imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800", isPrimary: true, displayOrder: 0 }
    ],
    options: [
      {
        id: "opt-color-ad",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-ad-wht", value: "Trắng", colorCode: "#ffffff", imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800", displayOrder: 0 }
        ]
      }
    ],
    variants: [
      { id: "v-ad-20w", sku: "CHG-20W-USBC", price: 549000, stock: 60, status: "active", imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800", optionValues: [{ optionType: "Màu sắc", value: "Trắng" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "p-cable-magsafe",
    name: "Cáp sạc MagSafe 3 Apple (2m)",
    description: "Cáp bện vải độ bền cao, đầu cắm hít nam châm MagSafe 3 chống rơi rớt, hỗ trợ công suất sạc nhanh lên đến 140W.",
    basePrice: 1290000,
    price: 1290000,
    stock: 45,
    status: "active",
    category: { id: "c-acc", name: "Phụ kiện" },
    images: [
      { id: "img-cb-1", imageUrl: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800", isPrimary: true, displayOrder: 0 }
    ],
    options: [
      {
        id: "opt-color-cb",
        name: "Màu sắc",
        displayOrder: 0,
        values: [
          { id: "c-cb-wht", value: "Bạc Bện Vải", colorCode: "#e3e4e5", imageUrl: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800", displayOrder: 0 }
        ]
      }
    ],
    variants: [
      { id: "v-cb-ms3", sku: "CAB-MS3-2M", price: 1290000, stock: 45, status: "active", imageUrl: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800", optionValues: [{ optionType: "Màu sắc", value: "Bạc Bện Vải" }] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
