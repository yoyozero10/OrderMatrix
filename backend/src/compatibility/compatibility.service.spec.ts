import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompatibilityService, SetupItem } from './compatibility.service';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { APPLE_HARDWARE_SPECS } from './constants/apple-rules.constant';

describe('CompatibilityService', () => {
  let service: CompatibilityService;

  const mockVariantRepository = {
    find: jest.fn(),
  };

  const mbpSpec = APPLE_HARDWARE_SPECS.find((s) => s.key === 'macbook_pro_16')!;
  const mbaSpec = APPLE_HARDWARE_SPECS.find((s) => s.key === 'macbook_air_15')!;
  const ip16Spec = APPLE_HARDWARE_SPECS.find((s) => s.key === 'iphone_16_pro_max')!;
  const awuSpec = APPLE_HARDWARE_SPECS.find((s) => s.key === 'apple_watch_ultra_2')!;
  const chargerSpec = APPLE_HARDWARE_SPECS.find((s) => s.key === 'adapter_20w')!;
  const magsafeSpec = APPLE_HARDWARE_SPECS.find((s) => s.key === 'magsafe3_cable')!;
  const appSpec = APPLE_HARDWARE_SPECS.find((s) => s.key === 'airpods_pro_2')!;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompatibilityService,
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockVariantRepository,
        },
      ],
    }).compile();

    service = module.get<CompatibilityService>(CompatibilityService);
    jest.clearAllMocks();
  });

  describe('getRules', () => {
    it('returns hardwareSpecs, colorPalettes, and bundleCriteria', () => {
      const rules = service.getRules();
      expect(rules.hardwareSpecs).toBeDefined();
      expect(rules.colorPalettes).toBeDefined();
      expect(rules.bundleCriteria).toHaveLength(2);
      expect(rules.bundleCriteria[0].coupon).toBe('STUDIOBUNDLE');
    });
  });

  describe('Power Validation', () => {
    it('warns when 20W charger is paired with MacBook Pro 16" (requires min 96W)', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-mbp',
          sku: 'MBP16M3M-SB-36-512',
          productName: 'MacBook Pro 16" M3 Max',
          price: 89990000,
          spec: mbpSpec,
        },
        {
          variantId: 'var-adapter',
          sku: 'ADAPTER-20W-WHT',
          productName: 'Củ sạc nhanh Apple 20W USB-C',
          price: 590000,
          spec: chargerSpec,
        },
      ];

      const result = service.validatePower(items);

      expect(result.status).toBe('warning');
      expect(result.totalSuppliedWattage).toBe(20);
      expect(result.totalRequiredWattage).toBe(96);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Củ sạc 20W không đủ công suất cấp nguồn cho MacBook Pro 16" M3 Max');
    });

    it('reports missing_power when devices are present without any charger', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-ip16',
          sku: 'IP16PM-DES-256',
          productName: 'iPhone 16 Pro Max',
          price: 34990000,
          spec: ip16Spec,
        },
      ];

      const result = service.validatePower(items);

      expect(result.status).toBe('missing_power');
      expect(result.totalSuppliedWattage).toBe(0);
      expect(result.totalRequiredWattage).toBe(20);
      expect(result.warnings[0]).toContain('Chưa có nguồn cấp điện');
    });

    it('evaluates adequate power when supplied wattage meets minimum requirement', () => {
      const customChargerSpec = {
        ...chargerSpec,
        outputPower: 40,
      };

      const items: SetupItem[] = [
        {
          variantId: 'var-mba',
          sku: 'MBA15M3-MID-256',
          productName: 'MacBook Air 15" M3',
          price: 32990000,
          spec: mbaSpec, // min: 35W, recommended: 70W
        },
        {
          variantId: 'var-charger-40w',
          sku: 'CHARGER-40W',
          productName: 'Củ sạc 40W',
          price: 990000,
          spec: customChargerSpec,
        },
      ];

      const result = service.validatePower(items);

      expect(result.status).toBe('adequate');
      expect(result.totalSuppliedWattage).toBe(40);
      expect(result.totalRequiredWattage).toBe(35);
    });

    it('evaluates optimal power when supplied wattage meets recommended requirement', () => {
      const optimalChargerSpec = {
        ...chargerSpec,
        outputPower: 140,
      };

      const items: SetupItem[] = [
        {
          variantId: 'var-mbp',
          sku: 'MBP16M3M-SB-36-512',
          productName: 'MacBook Pro 16" M3 Max',
          price: 89990000,
          spec: mbpSpec,
        },
        {
          variantId: 'var-charger-140w',
          sku: 'CHARGER-140W',
          productName: 'Củ sạc 140W',
          price: 2490000,
          spec: optimalChargerSpec,
        },
      ];

      const result = service.validatePower(items);

      expect(result.status).toBe('optimal');
      expect(result.totalSuppliedWattage).toBe(140);
      expect(result.totalRecommendedWattage).toBe(140);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Port & Cable Connectivity', () => {
    it('notes MagSafe 3 compatibility when MacBook and MagSafe 3 cable are both present', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-mbp',
          sku: 'MBP16M3M-SB-36-512',
          productName: 'MacBook Pro 16" M3 Max',
          price: 89990000,
          spec: mbpSpec,
        },
        {
          variantId: 'var-magsafe',
          sku: 'MAGSAFE3-SB',
          productName: 'Cáp sạc MagSafe 3 Apple (2m)',
          price: 1190000,
          spec: magsafeSpec,
        },
        {
          variantId: 'var-adapter',
          sku: 'ADAPTER-20W-WHT',
          productName: 'Củ sạc nhanh Apple 20W USB-C',
          price: 590000,
          spec: chargerSpec,
        },
      ];

      const result = service.validateConnectivity(items);

      expect(result.status).toBe('compatible');
      expect(result.notes.some((n) => n.includes('Cáp MagSafe 3 gắn hít từ tính'))).toBe(true);
      expect(result.portsAvailable).toContain('magsafe3');
      expect(result.portsAvailable).toContain('thunderbolt4');
    });

    it('reports incomplete connectivity when MagSafe 3 cable is present without a USB-C charger', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-mbp',
          sku: 'MBP16M3M-SB-36-512',
          productName: 'MacBook Pro 16" M3 Max',
          price: 89990000,
          spec: mbpSpec,
        },
        {
          variantId: 'var-magsafe',
          sku: 'MAGSAFE3-SB',
          productName: 'Cáp sạc MagSafe 3 Apple (2m)',
          price: 1190000,
          spec: magsafeSpec,
        },
      ];

      const result = service.validateConnectivity(items);

      expect(result.status).toBe('incomplete');
      expect(result.missingCables.some((c) => c.includes('Cần bổ sung củ sạc USB-C'))).toBe(true);
    });
  });

  describe('Color Harmony', () => {
    it('returns 100% harmony for single colored item or single color palette', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-ip16',
          sku: 'IP16PM-NAT-256',
          productName: 'iPhone 16 Pro Max',
          price: 34990000,
          spec: ip16Spec,
          colorName: 'Natural Titanium',
          colorCode: '#9E978E',
        },
      ];

      const result = service.calculateColorHarmony(items);

      expect(result.score).toBe(100);
      expect(result.dominantTheme).toBe('Đồng Nhất Tuyệt Đối');
    });

    it('returns 100% harmony when all devices share identical hex color', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-ip16',
          sku: 'IP16PM-NAT-256',
          productName: 'iPhone 16 Pro Max',
          price: 34990000,
          spec: ip16Spec,
          colorName: 'Natural Titanium',
          colorCode: '#9E978E',
        },
        {
          variantId: 'var-awu',
          sku: 'AWU2-NAT-ALP-49',
          productName: 'Apple Watch Ultra 2',
          price: 21990000,
          spec: awuSpec,
          colorName: 'Natural Titanium',
          colorCode: '#9E978E',
        },
      ];

      const result = service.calculateColorHarmony(items);

      expect(result.score).toBe(100);
      expect(result.dominantTheme).toContain('Đồng Điệu Tuyệt Đối');
    });

    it('returns high harmony (>90%) for devices within Titanium family', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-ip16',
          sku: 'IP16PM-DES-256',
          productName: 'iPhone 16 Pro Max',
          price: 34990000,
          spec: ip16Spec,
          colorName: 'Desert Titanium',
          colorCode: '#C3A68F',
        },
        {
          variantId: 'var-awu',
          sku: 'AWU2-NAT-ALP-49',
          productName: 'Apple Watch Ultra 2',
          price: 21990000,
          spec: awuSpec,
          colorName: 'Natural Titanium',
          colorCode: '#9E978E',
        },
      ];

      const result = service.calculateColorHarmony(items);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.palette).toBe('titanium');
    });

    it('returns high score for classic Space Black & Silver duo contrast', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-mbp',
          sku: 'MBP16M3M-SB-36-512',
          productName: 'MacBook Pro 16" M3 Max',
          price: 89990000,
          spec: mbpSpec,
          colorName: 'Space Black',
          colorCode: '#2E2F32',
        },
        {
          variantId: 'var-mba',
          sku: 'MBA15M3-SIL-256',
          productName: 'MacBook Air 15" M3',
          price: 32990000,
          spec: mbaSpec,
          colorName: 'Silver',
          colorCode: '#E3E4E5',
        },
      ];

      const result = service.calculateColorHarmony(items);

      expect(result.score).toBeGreaterThanOrEqual(88);
      expect(result.dominantTheme).toContain('Tương Phản');
    });
  });

  describe('Bundle Pricing & Recommendation', () => {
    it('qualifies for Studio Bundle with 10% discount when Computer + Phone + Accessory are present', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-mbp',
          sku: 'MBP16M3M-SB-36-512',
          productName: 'MacBook Pro 16" M3 Max',
          price: 89990000,
          spec: mbpSpec,
        },
        {
          variantId: 'var-ip16',
          sku: 'IP16PM-DES-256',
          productName: 'iPhone 16 Pro Max',
          price: 34990000,
          spec: ip16Spec,
        },
        {
          variantId: 'var-magsafe',
          sku: 'MAGSAFE3-SB',
          productName: 'Cáp sạc MagSafe 3 Apple (2m)',
          price: 1190000,
          spec: magsafeSpec,
        },
      ];

      const result = service.calculateBundlePricing(items);

      const expectedSubtotal = 89990000 + 34990000 + 1190000;
      const expectedDiscount = Math.round(expectedSubtotal * 0.1);

      expect(result.bundleName).toBe('Apple Ecosystem Studio Bundle');
      expect(result.suggestedCoupon).toBe('STUDIOBUNDLE');
      expect(result.discountPercent).toBe(10);
      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.discountAmount).toBe(expectedDiscount);
      expect(result.finalTotal).toBe(expectedSubtotal - expectedDiscount);
    });

    it('suggests Duo combo for 2 items', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-ip16',
          sku: 'IP16PM-DES-256',
          productName: 'iPhone 16 Pro Max',
          price: 34990000,
          spec: ip16Spec,
        },
        {
          variantId: 'var-app2',
          sku: 'APP2-USBC-WHT',
          productName: 'AirPods Pro 2 (USB-C)',
          price: 6190000,
          spec: appSpec,
        },
      ];

      const result = service.calculateBundlePricing(items);

      expect(result.bundleName).toBe('Apple Duo Setup Combo');
      expect(result.suggestedCoupon).toBe('APPLE10');
      expect(result.discountPercent).toBe(10);
      expect(result.discountAmount).toBe(2000000); // capped at 2,000,000đ
    });

    it('does not apply bundle discounts for single item', () => {
      const items: SetupItem[] = [
        {
          variantId: 'var-ip16',
          sku: 'IP16PM-DES-256',
          productName: 'iPhone 16 Pro Max',
          price: 34990000,
          spec: ip16Spec,
        },
      ];

      const result = service.calculateBundlePricing(items);

      expect(result.suggestedCoupon).toBeNull();
      expect(result.discountPercent).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.finalTotal).toBe(34990000);
    });
  });

  describe('validateSetup (Integration)', () => {
    it('throws BadRequestException if variantIds is empty', async () => {
      await expect(service.validateSetup({ variantIds: [] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFoundException if no variants found in DB', async () => {
      mockVariantRepository.find.mockResolvedValue([]);

      await expect(
        service.validateSetup({ variantIds: ['non-existent-id'] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns full validation analysis for valid setup', async () => {
      const mockDbVariants = [
        {
          id: 'var-1',
          sku: 'IP16PM-DES-256',
          price: 34990000,
          product: {
            name: 'iPhone 16 Pro Max',
            category: { name: 'Điện thoại' },
            images: [{ imageUrl: 'https://img.unsplash.com/1' }],
          },
          optionValues: [
            {
              optionValue: {
                value: 'Desert Titanium',
                colorCode: '#C3A68F',
                imageUrl: 'https://img.unsplash.com/color-1',
                optionType: { name: 'Màu sắc' },
              },
            },
          ],
        },
        {
          id: 'var-2',
          sku: 'ADAPTER-20W-WHT',
          price: 590000,
          product: {
            name: 'Củ sạc nhanh Apple 20W USB-C',
            category: { name: 'Phụ kiện' },
            images: [{ imageUrl: 'https://img.unsplash.com/2' }],
          },
          optionValues: [],
        },
      ];

      mockVariantRepository.find.mockResolvedValue(mockDbVariants);

      const result = await service.validateSetup({
        variantIds: ['var-1', 'var-2'],
      });

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.power.totalSuppliedWattage).toBe(20);
      expect(result.colorHarmony).toBeDefined();
      expect(result.bundle.bundleName).toBe('Apple Duo Setup Combo');
      expect(result.items).toHaveLength(2);
    });
  });
});
