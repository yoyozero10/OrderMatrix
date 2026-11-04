import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ValidateSetupDto } from './dto/validate-setup.dto';
import {
  APPLE_HARDWARE_SPECS,
  COLOR_PALETTES,
  DeviceHardwareSpec,
} from './constants/apple-rules.constant';

export interface SetupItem {
  variantId: string;
  sku: string;
  productName: string;
  price: number;
  spec: DeviceHardwareSpec;
  colorName?: string;
  colorCode?: string | null;
  imageUrl?: string | null;
}

export interface PowerValidationResult {
  status: 'optimal' | 'adequate' | 'warning' | 'missing_power';
  totalSuppliedWattage: number;
  totalRequiredWattage: number;
  totalRecommendedWattage: number;
  warnings: string[];
  details: {
    deviceName: string;
    category: string;
    minPower: number;
    recommendedPower: number;
  }[];
}

export interface ConnectivityValidationResult {
  status: 'compatible' | 'warning' | 'incomplete';
  missingCables: string[];
  portsAvailable: string[];
  notes: string[];
}

export interface ColorHarmonyResult {
  score: number;
  palette: string;
  dominantTheme: string;
  details: {
    deviceName: string;
    colorName?: string;
    colorCode?: string | null;
  }[];
  suggestion: string;
}

export interface BundlePricingResult {
  bundleName: string;
  totalItems: number;
  subtotal: number;
  suggestedCoupon: string | null;
  discountPercent: number;
  discountAmount: number;
  finalTotal: number;
  savingsMessage: string;
}

export interface CompatibilityValidationResponse {
  valid: boolean;
  score: number;
  summary: string;
  power: PowerValidationResult;
  connectivity: ConnectivityValidationResult;
  colorHarmony: ColorHarmonyResult;
  bundle: BundlePricingResult;
  items: SetupItem[];
}

@Injectable()
export class CompatibilityService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  /**
   * Lấy danh sách quy tắc và thông số kỹ thuật phần cứng
   */
  getRules() {
    return {
      hardwareSpecs: APPLE_HARDWARE_SPECS,
      colorPalettes: COLOR_PALETTES,
      bundleCriteria: [
        {
          name: 'Apple Ecosystem Studio Bundle',
          criteria: 'Ít nhất 1 Máy tính + 1 Thiết bị di động/Âm thanh/Đồng hồ + 1 Phụ kiện (hoặc 3 danh mục khác nhau)',
          coupon: 'STUDIOBUNDLE',
          discount: '10%',
        },
        {
          name: 'Apple Duo Setup',
          criteria: 'Từ 2 thiết bị Apple trên bàn',
          coupon: 'APPLE10',
          discount: '10% (tối đa 2.000.000đ)',
        },
      ],
    };
  }

  /**
   * Phân tích và đánh giá tính tương thích của toàn bộ setup trên bàn
   */
  async validateSetup(dto: ValidateSetupDto): Promise<CompatibilityValidationResponse> {
    const { variantIds } = dto;
    if (!variantIds || variantIds.length === 0) {
      throw new BadRequestException('Danh sách variantIds không được để trống');
    }

    // 1. Tải các biến thể từ cơ sở dữ liệu
    const variants = await this.variantRepository.find({
      where: { id: In(variantIds) },
      relations: [
        'product',
        'product.category',
        'product.images',
        'optionValues',
        'optionValues.optionValue',
        'optionValues.optionValue.optionType',
      ],
    });

    if (variants.length === 0) {
      throw new NotFoundException('Không tìm thấy biến thể sản phẩm nào tương ứng với các ID đã cung cấp');
    }

    // 2. Map dữ liệu vào SetupItem kèm thông số phần cứng
    const items: SetupItem[] = variants.map((variant) => {
      const spec = this.matchHardwareSpec(variant);
      let colorName: string | undefined;
      let colorCode: string | null = null;
      let imageUrl: string | null = null;

      for (const vov of variant.optionValues ?? []) {
        if (vov.optionValue?.optionType?.name === 'Màu sắc') {
          colorName = vov.optionValue.value;
          colorCode = vov.optionValue.colorCode ?? null;
          imageUrl = vov.optionValue.imageUrl ?? null;
          break;
        }
      }

      if (!imageUrl && variant.product?.images?.length) {
        imageUrl = variant.product.images[0].imageUrl;
      }

      return {
        variantId: variant.id,
        sku: variant.sku,
        productName: variant.product?.name || 'Apple Device',
        price: Number(variant.price),
        spec,
        colorName,
        colorCode,
        imageUrl,
      };
    });

    // 3. Thực thi các khâu thẩm định
    const power = this.validatePower(items);
    const connectivity = this.validateConnectivity(items);
    const colorHarmony = this.calculateColorHarmony(items);
    const bundle = this.calculateBundlePricing(items);

    // 4. Tính điểm tổng quan (Overall Setup Score: 0 - 100)
    let powerScore = 100;
    if (power.status === 'warning') powerScore = 40;
    else if (power.status === 'missing_power') powerScore = 60;
    else if (power.status === 'adequate') powerScore = 85;

    let connScore = 100;
    if (connectivity.status === 'warning') connScore = 70;
    else if (connectivity.status === 'incomplete') connScore = 50;

    const overallScore = Math.round(
      powerScore * 0.4 + colorHarmony.score * 0.35 + connScore * 0.25,
    );

    let summary = 'Không gian làm việc Apple cân đối, hài hòa và đồng bộ cao.';
    if (power.warnings.length > 0) {
      summary = `Cảnh báo nguồn điện: ${power.warnings[0]}`;
    } else if (overallScore >= 90) {
      summary = 'Không gian làm việc đẳng cấp: Công suất tối ưu, màu sắc đồng điệu chuẩn Pro Studio.';
    }

    return {
      valid: power.status !== 'warning',
      score: overallScore,
      summary,
      power,
      connectivity,
      colorHarmony,
      bundle,
      items,
    };
  }

  /**
   * Khớp biến thể với cấu hình phần cứng Apple
   */
  private matchHardwareSpec(variant: ProductVariant): DeviceHardwareSpec {
    const sku = variant.sku || '';
    const productName = variant.product?.name || '';

    for (const spec of APPLE_HARDWARE_SPECS) {
      if (spec.skuPrefix && sku.startsWith(spec.skuPrefix)) {
        return spec;
      }
      if (spec.matchNames.some((name) => productName.toLowerCase().includes(name.toLowerCase()))) {
        return spec;
      }
    }

    // Fallback mặc định
    return {
      key: 'generic_device',
      displayName: productName,
      category: 'phone',
      minPower: 20,
      recommendedPower: 30,
      ports: ['usbc'],
      chargingPorts: ['usbc'],
      matchNames: [productName],
    };
  }

  /**
   * 1. Power Validation: Tính toán công suất sạc và cảnh báo không tương thích
   */
  validatePower(items: SetupItem[]): PowerValidationResult {
    let totalSuppliedWattage = 0;
    let totalRequiredWattage = 0;
    let totalRecommendedWattage = 0;
    const warnings: string[] = [];
    const details: PowerValidationResult['details'] = [];

    const chargers = items.filter((item) => item.spec.isPowerSource);
    const devices = items.filter((item) => !item.spec.isPowerSource && !item.spec.isCable);

    for (const charger of chargers) {
      totalSuppliedWattage += charger.spec.outputPower || 0;
    }

    for (const device of devices) {
      const minP = device.spec.minPower || 0;
      const recP = device.spec.recommendedPower || minP;
      totalRequiredWattage += minP;
      totalRecommendedWattage += recP;

      details.push({
        deviceName: device.productName,
        category: device.spec.category,
        minPower: minP,
        recommendedPower: recP,
      });

      // Kiểm tra cá nhân từng thiết bị có nhu cầu công suất cao
      if (chargers.length > 0) {
        const maxSingleCharger = Math.max(...chargers.map((c) => c.spec.outputPower || 0));

        if (device.spec.key === 'macbook_pro_16' && maxSingleCharger < (device.spec.minPower || 96)) {
          warnings.push(
            `Cảnh báo công suất: Củ sạc ${maxSingleCharger}W không đủ công suất cấp nguồn cho MacBook Pro 16" M3 Max (yêu cầu tối thiểu ${device.spec.minPower}W, khuyên dùng ${device.spec.recommendedPower}W). Máy có thể bị sạc chậm hoặc tụt pin khi làm việc nặng.`,
          );
        } else if (device.spec.key === 'macbook_air_15' && maxSingleCharger < (device.spec.minPower || 35)) {
          warnings.push(
            `Cảnh báo công suất: Củ sạc ${maxSingleCharger}W thấp hơn công suất yêu cầu tối thiểu ${device.spec.minPower}W của MacBook Air 15" M3.`,
          );
        }
      }
    }

    if (chargers.length === 0 && devices.length > 0) {
      warnings.push('Chưa có nguồn cấp điện: Bạn chưa chọn củ sạc hoặc nguồn điện cho các thiết bị trên bàn.');
    }

    let status: PowerValidationResult['status'] = 'optimal';
    if (warnings.some((w) => w.startsWith('Cảnh báo công suất:'))) {
      status = 'warning';
    } else if (chargers.length === 0) {
      status = 'missing_power';
    } else if (totalSuppliedWattage < totalRequiredWattage) {
      status = 'warning';
      warnings.push(
        `Tổng công suất cấp sạc (${totalSuppliedWattage}W) nhỏ hơn tổng công suất tối thiểu cần thiết (${totalRequiredWattage}W).`,
      );
    } else if (totalSuppliedWattage < totalRecommendedWattage) {
      status = 'adequate';
    } else {
      status = 'optimal';
    }

    return {
      status,
      totalSuppliedWattage,
      totalRequiredWattage,
      totalRecommendedWattage,
      warnings,
      details,
    };
  }

  /**
   * 2. Port & Cable Connectivity: Kiểm tra kết nối cổng và dây sạc
   */
  validateConnectivity(items: SetupItem[]): ConnectivityValidationResult {
    const notes: string[] = [];
    const missingCables: string[] = [];
    const portsAvailableSet = new Set<string>();

    const hasMacBook = items.some((i) => i.spec.category === 'laptop');
    const hasMagSafeCable = items.some((i) => i.spec.key === 'magsafe3_cable');
    const hasCharger = items.some((i) => i.spec.isPowerSource);
    const hasAppleWatch = items.some((i) => i.spec.category === 'watch');
    const hasUSBCDevice = items.some((i) =>
      ['phone', 'tablet', 'audio'].includes(i.spec.category),
    );

    for (const item of items) {
      for (const p of item.spec.ports || []) {
        portsAvailableSet.add(p);
      }
    }

    if (hasMacBook) {
      if (hasMagSafeCable) {
        notes.push('Cáp MagSafe 3 gắn hít từ tính an toàn, bảo vệ cổng Thunderbolt cho MacBook.');
        if (!hasCharger) {
          missingCables.push('Cần bổ sung củ sạc USB-C có công suất phù hợp để kết nối cáp MagSafe 3.');
        }
      } else {
        notes.push('MacBook Pro / Air hỗ trợ sạc nhanh MagSafe 3. Bạn có thể bổ sung cáp MagSafe 3 chính hãng.');
      }
    }

    if (hasAppleWatch) {
      notes.push('Apple Watch yêu cầu cáp sạc từ tính Magnetic Fast Charger với đầu cắm USB-C.');
    }

    if (hasUSBCDevice) {
      notes.push('Các thiết bị iPhone / iPad / AirPods hỗ trợ chuẩn cắm USB-C tiêu chuẩn toàn cầu.');
    }

    let status: ConnectivityValidationResult['status'] = 'compatible';
    if (missingCables.length > 0) {
      status = 'incomplete';
    }

    return {
      status,
      missingCables,
      portsAvailable: Array.from(portsAvailableSet),
      notes,
    };
  }

  /**
   * 3. Color Harmony Score (0 - 100%): Tính toán độ đồng điệu thẩm mỹ
   */
  calculateColorHarmony(items: SetupItem[]): ColorHarmonyResult {
    const coloredItems = items.filter((i) => i.colorCode || i.colorName);

    if (coloredItems.length <= 1) {
      return {
        score: 100,
        palette: 'Đồng màu tối giản',
        dominantTheme: 'Đồng Nhất Tuyệt Đối',
        details: coloredItems.map((i) => ({
          deviceName: i.productName,
          colorName: i.colorName,
          colorCode: i.colorCode,
        })),
        suggestion: 'Thiết bị đơn lẻ hoặc tone-sur-tone mang lại vẻ đẹp tối giản chuẩn Apple.',
      };
    }

    const hexList = coloredItems.map((i) => (i.colorCode || '').toUpperCase());
    const uniqueHexes = Array.from(new Set(hexList.filter(Boolean)));

    // Nếu tất cả cùng chung 1 mã màu Hex chính xác
    if (uniqueHexes.length === 1) {
      return {
        score: 100,
        palette: 'Tone-sur-Tone',
        dominantTheme: `Đồng Điệu Tuyệt Đối (${coloredItems[0].colorName || uniqueHexes[0]})`,
        details: coloredItems.map((i) => ({
          deviceName: i.productName,
          colorName: i.colorName,
          colorCode: i.colorCode,
        })),
        suggestion: 'Bộ sưu tập đạt sự hài hòa tuyệt đối, đậm chất thiết kế của Jony Ive.',
      };
    }

    // Đếm số lượng màu rơi vào từng bảng màu COLOR_PALETTES
    const paletteCounts: Record<string, number> = {};
    for (const hex of hexList) {
      for (const p of COLOR_PALETTES) {
        if (p.hexes.map((h) => h.toUpperCase()).includes(hex)) {
          paletteCounts[p.id] = (paletteCounts[p.id] || 0) + 1;
        }
      }
    }

    let bestPalette = COLOR_PALETTES[0];
    let maxCount = 0;
    for (const p of COLOR_PALETTES) {
      const count = paletteCounts[p.id] || 0;
      if (count > maxCount) {
        maxCount = count;
        bestPalette = p;
      }
    }

    const matchRatio = maxCount / hexList.length;
    let score = Math.round(75 + matchRatio * 20); // 75 - 95

    let dominantTheme = bestPalette.name;
    let suggestion = 'Màu sắc phối hợp ăn ý, tôn vinh chất liệu kim loại cao cấp.';

    // Kiểm tra cặp tương phản kinh điển (Space Black + Silver) hoặc (Titanium + Space Black)
    const hasSpaceBlack = hexList.includes('#2E2F32') || hexList.includes('#191F26');
    const hasSilver = hexList.includes('#E3E4E5') || hexList.includes('#FFFFFF');
    const hasTitanium = hexList.includes('#C3A68F') || hexList.includes('#9E978E');

    if (matchRatio >= 1) {
      score = 95;
      dominantTheme = `${bestPalette.name} Đồng Điệu`;
      suggestion = 'Toàn bộ thiết bị thuộc cùng một ngôn ngữ thiết kế và họ màu sắc kim loại.';
    } else if (hasSpaceBlack && hasSilver && hexList.length === 2) {
      score = 92;
      dominantTheme = 'Tương Phản Đen Không Gian & Bạc Nguyên Khối (Monochrome)';
      suggestion = 'Sự kết hợp tương phản kinh điển giữa sáng và tối mang lại cảm giác mạnh mẽ, chuyên nghiệp.';
    } else if (hasTitanium && hasSpaceBlack) {
      score = 88;
      dominantTheme = 'Titanium & Dark Precision';
      suggestion = 'Phối màu tinh tế giữa ánh xám titan và sắc đen không gian.';
    } else if (score < 80) {
      suggestion = 'Gợi ý: Bạn có thể chọn phụ kiện cùng tông Titanium hoặc Đen Không Gian để setup đồng điệu hơn.';
    }

    return {
      score: Math.min(100, Math.max(50, score)),
      palette: bestPalette.id,
      dominantTheme,
      details: coloredItems.map((i) => ({
        deviceName: i.productName,
        colorName: i.colorName,
        colorCode: i.colorCode,
      })),
      suggestion,
    };
  }

  /**
   * 4. Bundle Pricing & Recommendation: Tính tổng giá và gợi ý mã giảm giá combo
   */
  calculateBundlePricing(items: SetupItem[]): BundlePricingResult {
    const subtotal = items.reduce((sum, i) => sum + i.price, 0);
    const categories = new Set(items.map((i) => i.spec.category));

    const hasComputer = categories.has('laptop') || categories.has('tablet');
    const hasPersonalDevice =
      categories.has('phone') || categories.has('watch') || categories.has('audio');
    const hasAccessory = categories.has('charger') || categories.has('cable');

    // Điều kiện Studio Bundle: Có máy tính + có thiết bị cá nhân + có phụ kiện (hoặc từ 3 danh mục)
    const isStudioBundle =
      (hasComputer && hasPersonalDevice && hasAccessory) || categories.size >= 3;

    if (isStudioBundle) {
      const discountPercent = 10;
      const discountAmount = Math.round(subtotal * (discountPercent / 100));
      const finalTotal = subtotal - discountAmount;

      return {
        bundleName: 'Apple Ecosystem Studio Bundle',
        totalItems: items.length,
        subtotal,
        suggestedCoupon: 'STUDIOBUNDLE',
        discountPercent,
        discountAmount,
        finalTotal,
        savingsMessage: `Đủ điều kiện Combo Studio: Tặng mã STUDIOBUNDLE giảm ngay 10% (tiết kiệm ${discountAmount.toLocaleString('vi-VN')}đ)!`,
      };
    }

    // Điều kiện Duo Setup: từ 2 thiết bị
    if (items.length >= 2) {
      const discountPercent = 10;
      const discountAmount = Math.min(2000000, Math.round(subtotal * (discountPercent / 100)));
      const finalTotal = subtotal - discountAmount;

      return {
        bundleName: 'Apple Duo Setup Combo',
        totalItems: items.length,
        subtotal,
        suggestedCoupon: 'APPLE10',
        discountPercent,
        discountAmount,
        finalTotal,
        savingsMessage: `Ưu đãi bộ đôi Apple: Áp dụng mã APPLE10 để giảm thêm ${discountAmount.toLocaleString('vi-VN')}đ!`,
      };
    }

    return {
      bundleName: 'Thiết bị đơn lẻ',
      totalItems: items.length,
      subtotal,
      suggestedCoupon: null,
      discountPercent: 0,
      discountAmount: 0,
      finalTotal: subtotal,
      savingsMessage: 'Thêm thiết bị hoặc phụ kiện lên bàn làm việc để kích hoạt ưu đãi Combo Bundle!',
    };
  }
}
