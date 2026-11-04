import type {
  CompatibilityPowerItem,
  CompatibilityReport,
  CompatibilityWarning
} from "@/lib/api/types";

export interface CanvasDeviceMeta {
  category: "mac" | "ipad" | "iphone" | "watch" | "audio" | "accessory";
  powerType: "consumer" | "provider" | "passive";
  minPowerWatts?: number;
  maxPowerWatts?: number;
  outputPowerWatts?: number;
  ports: string[];
  colorGroup?: string;
  defaultWidth?: number; // for canvas rendering
  defaultHeight?: number;
}

export interface PlacedItem {
  instanceId: string;
  productId: string;
  variantId: string;
  name: string;
  categoryName: string;
  sku: string;
  price: number;
  imageUrl: string;
  colorCode?: string;
  colorName?: string;
  options: Record<string, string>;
  x: number;
  y: number;
  zIndex: number;
}

export const DEVICE_RULES: Record<string, CanvasDeviceMeta> = {
  // MacBook Pro 16
  "macbook-pro": {
    category: "mac",
    powerType: "consumer",
    minPowerWatts: 96,
    maxPowerWatts: 140,
    ports: ["magsafe3", "thunderbolt4"],
    colorGroup: "dark_silver",
    defaultWidth: 160,
    defaultHeight: 120
  },
  // MacBook Air 15
  "macbook-air": {
    category: "mac",
    powerType: "consumer",
    minPowerWatts: 35,
    maxPowerWatts: 70,
    ports: ["magsafe3", "thunderbolt3"],
    colorGroup: "midnight_starlight",
    defaultWidth: 140,
    defaultHeight: 105
  },
  // iPad Pro M4
  "ipad-pro": {
    category: "ipad",
    powerType: "consumer",
    minPowerWatts: 20,
    maxPowerWatts: 30,
    ports: ["thunderbolt", "usbc"],
    colorGroup: "dark_silver",
    defaultWidth: 110,
    defaultHeight: 130
  },
  // iPhone 16 Pro Max
  "iphone-16": {
    category: "iphone",
    powerType: "consumer",
    minPowerWatts: 20,
    maxPowerWatts: 30,
    ports: ["usbc"],
    colorGroup: "titanium",
    defaultWidth: 65,
    defaultHeight: 110
  },
  // iPhone 15 Pro Max
  "iphone-15": {
    category: "iphone",
    powerType: "consumer",
    minPowerWatts: 20,
    maxPowerWatts: 30,
    ports: ["usbc"],
    colorGroup: "titanium",
    defaultWidth: 65,
    defaultHeight: 110
  },
  // Apple Watch Ultra 2
  "watch-ultra": {
    category: "watch",
    powerType: "consumer",
    minPowerWatts: 5,
    maxPowerWatts: 5,
    ports: ["magnetic_usbc"],
    colorGroup: "titanium",
    defaultWidth: 60,
    defaultHeight: 70
  },
  // Apple Watch Series 9
  "watch-series": {
    category: "watch",
    powerType: "consumer",
    minPowerWatts: 5,
    maxPowerWatts: 5,
    ports: ["magnetic_usbc"],
    colorGroup: "midnight_starlight",
    defaultWidth: 55,
    defaultHeight: 65
  },
  // AirPods Pro 2
  "airpods-pro": {
    category: "audio",
    powerType: "consumer",
    minPowerWatts: 5,
    maxPowerWatts: 5,
    ports: ["usbc", "magsafe_audio"],
    colorGroup: "white",
    defaultWidth: 50,
    defaultHeight: 45
  },
  // AirPods Max
  "airpods-max": {
    category: "audio",
    powerType: "consumer",
    minPowerWatts: 5,
    maxPowerWatts: 10,
    ports: ["usbc", "lightning"],
    colorGroup: "space_silver",
    defaultWidth: 90,
    defaultHeight: 90
  },
  // 20W Power Adapter
  "adapter-20w": {
    category: "accessory",
    powerType: "provider",
    outputPowerWatts: 20,
    ports: ["usbc"],
    colorGroup: "white",
    defaultWidth: 50,
    defaultHeight: 50
  },
  // 70W / 140W Power Adapter
  "adapter-high": {
    category: "accessory",
    powerType: "provider",
    outputPowerWatts: 140,
    ports: ["usbc"],
    colorGroup: "white",
    defaultWidth: 65,
    defaultHeight: 65
  },
  // MagSafe 3 Cable
  "cable-magsafe": {
    category: "accessory",
    powerType: "passive",
    maxPowerWatts: 140,
    ports: ["magsafe3", "usbc"],
    colorGroup: "white",
    defaultWidth: 70,
    defaultHeight: 35
  }
};

export function matchDeviceMeta(name: string): CanvasDeviceMeta {
  const n = name.toLowerCase();
  if (n.includes("macbook pro")) return DEVICE_RULES["macbook-pro"];
  if (n.includes("macbook air")) return DEVICE_RULES["macbook-air"];
  if (n.includes("ipad")) return DEVICE_RULES["ipad-pro"];
  if (n.includes("iphone 16")) return DEVICE_RULES["iphone-16"];
  if (n.includes("iphone 15")) return DEVICE_RULES["iphone-15"];
  if (n.includes("ultra")) return DEVICE_RULES["watch-ultra"];
  if (n.includes("series") || n.includes("watch")) return DEVICE_RULES["watch-series"];
  if (n.includes("pro 2") || (n.includes("airpods") && !n.includes("max"))) return DEVICE_RULES["airpods-pro"];
  if (n.includes("airpods max")) return DEVICE_RULES["airpods-max"];
  if (n.includes("20w") || n.includes("củ sạc") || n.includes("adapter")) return DEVICE_RULES["adapter-20w"];
  if (n.includes("magsafe") && n.includes("cáp")) return DEVICE_RULES["cable-magsafe"];

  // Default fallback
  return {
    category: "accessory",
    powerType: "passive",
    ports: ["usbc"],
    defaultWidth: 60,
    defaultHeight: 60
  };
}

export function analyzeCompatibility(items: PlacedItem[]): CompatibilityReport {
  if (items.length === 0) {
    return {
      isCompatible: true,
      power: {
        totalRequiredWatts: 0,
        totalSuppliedWatts: 0,
        balanceWatts: 0,
        status: "none",
        details: []
      },
      colorHarmony: {
        score: 100,
        theme: "Bàn làm việc trống",
        dominantColors: [],
        isHarmonious: true
      },
      connectivity: {
        portsMatched: true,
        missingCables: [],
        notes: ["Hãy thêm thiết bị Apple từ thanh Dock bên dưới lên bàn làm việc."]
      },
      warnings: [],
      bundle: {
        totalPrice: 0,
        eligibleForBundle: false
      }
    };
  }

  // 1. Power Analysis
  let totalRequiredWatts = 0;
  let totalSuppliedWatts = 0;
  const powerDetails: CompatibilityPowerItem[] = [];
  const warnings: CompatibilityWarning[] = [];

  const consumers: { item: PlacedItem; meta: CanvasDeviceMeta }[] = [];
  const providers: { item: PlacedItem; meta: CanvasDeviceMeta }[] = [];
  const passives: { item: PlacedItem; meta: CanvasDeviceMeta }[] = [];

  items.forEach((item) => {
    const meta = matchDeviceMeta(item.name);
    if (meta.powerType === "consumer") {
      consumers.push({ item, meta });
      const req = meta.minPowerWatts || 15;
      totalRequiredWatts += req;
      powerDetails.push({
        id: item.instanceId,
        name: item.name,
        type: "consumer",
        powerWatts: req,
        minWatts: meta.minPowerWatts,
        maxWatts: meta.maxPowerWatts
      });
    } else if (meta.powerType === "provider") {
      providers.push({ item, meta });
      const sup = meta.outputPowerWatts || 20;
      totalSuppliedWatts += sup;
      powerDetails.push({
        id: item.instanceId,
        name: item.name,
        type: "provider",
        powerWatts: sup
      });
    } else {
      passives.push({ item, meta });
    }
  });

  // Check specific power mismatch: e.g. 20W charger with MacBook Pro 16 (needs 96W-140W)
  const hasMacBookPro16 = consumers.some((c) => c.item.name.toLowerCase().includes("macbook pro"));
  const hasOnly20WCharger =
    providers.length > 0 &&
    providers.every((p) => (p.meta.outputPowerWatts || 0) <= 30);

  if (hasMacBookPro16 && hasOnly20WCharger) {
    warnings.push({
      level: "warning",
      title: "Công suất sạc không đủ cho MacBook Pro",
      message:
        "Củ sạc 20W USB-C không đủ cấp nguồn tối thiểu 96W cho MacBook Pro 16 M3 Max khi hoạt động hiệu năng cao. Máy có thể tụt pin hoặc sạc chậm."
    });
  }

  if (consumers.length > 0 && providers.length === 0) {
    warnings.push({
      level: "info",
      title: "Chưa có củ sạc cấp nguồn",
      message: "Setup có các thiết bị cần sạc nhưng chưa có củ sạc hoặc nguồn điện trên bàn."
    });
  }

  const balanceWatts = totalSuppliedWatts - totalRequiredWatts;
  let powerStatus: "sufficient" | "deficit" | "none" = "none";
  if (consumers.length > 0 || providers.length > 0) {
    powerStatus = balanceWatts >= 0 ? "sufficient" : "deficit";
  }

  // 2. Connectivity & Cable Analysis
  const missingCables: string[] = [];
  const notes: string[] = [];

  const hasMagSafeDevice = consumers.some((c) => c.meta.ports.includes("magsafe3"));
  const hasMagSafeCable = passives.some((p) => p.meta.ports.includes("magsafe3"));

  if (hasMagSafeDevice && !hasMagSafeCable) {
    notes.push("MacBook hỗ trợ sạc nhanh MagSafe 3. Bạn có thể thêm Cáp MagSafe 3 để tối ưu tốc độ.");
  }

  const hasAppleWatch = consumers.some((c) => c.meta.category === "watch");
  if (hasAppleWatch) {
    notes.push("Apple Watch sử dụng sạc từ tính Magnetic Fast Charger đi kèm trong hộp.");
  }

  // 3. Color Harmony Score (0 - 100%)
  const colors: string[] = [];
  items.forEach((it) => {
    if (it.colorCode) colors.push(it.colorCode);
  });

  let colorScore = 85;
  let harmonyTheme = "Hài hòa tự nhiên";

  const allNames = items.map((i) => (i.colorName || "").toLowerCase());
  const titaniumCount = allNames.filter((c) => c.includes("titan")).length;
  const darkCount = allNames.filter(
    (c) => c.includes("black") || c.includes("đen") || c.includes("midnight") || c.includes("tối")
  ).length;
  const silverCount = allNames.filter(
    (c) => c.includes("silver") || c.includes("bạc") || c.includes("trắng") || c.includes("white")
  ).length;

  if (items.length >= 2) {
    if (titaniumCount >= items.length - 1) {
      colorScore = 98;
      harmonyTheme = "Titanium Đồng Điệu";
    } else if (darkCount >= items.length - 1) {
      colorScore = 96;
      harmonyTheme = "Không Gian Tối (Space Black / Midnight)";
    } else if (silverCount >= items.length - 1) {
      colorScore = 95;
      harmonyTheme = "Bạc Ánh Kim (Silver & Starlight)";
    } else if (titaniumCount > 0 && darkCount > 0 && silverCount === 0) {
      colorScore = 90;
      harmonyTheme = "Titanium & Space Black Sang Trọng";
    } else {
      colorScore = 88;
      harmonyTheme = "Phối Màu Studio Đa Sắc";
    }
  } else {
    colorScore = 100;
    harmonyTheme = items[0]?.colorName || "Đơn sắc chuẩn Apple";
  }

  // 4. Bundle Pricing & Recommendation
  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const eligibleForBundle = items.length >= 2;
  const suggestedCoupon = eligibleForBundle ? "STUDIOBUNDLE" : undefined;
  const discountPercent = eligibleForBundle ? 10 : 0;
  const discountAmount = eligibleForBundle ? Math.round((totalPrice * discountPercent) / 100) : 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const bundleMessage = eligibleForBundle
    ? `Tiết kiệm 10% với mã ưu đãi ${suggestedCoupon} khi mua trọn bộ ${items.length} thiết bị!`
    : "Thêm ít nhất 2 thiết bị lên bàn để kích hoạt ưu đãi trọn bộ combo.";

  return {
    isCompatible: warnings.filter((w) => w.level === "error").length === 0,
    power: {
      totalRequiredWatts,
      totalSuppliedWatts,
      balanceWatts,
      status: powerStatus,
      details: powerDetails
    },
    colorHarmony: {
      score: colorScore,
      theme: harmonyTheme,
      dominantColors: Array.from(new Set(colors)),
      isHarmonious: colorScore >= 80
    },
    connectivity: {
      portsMatched: true,
      missingCables,
      notes
    },
    warnings,
    bundle: {
      totalPrice,
      eligibleForBundle,
      suggestedCoupon,
      discountPercent,
      discountAmount,
      finalPrice,
      message: bundleMessage
    }
  };
}
