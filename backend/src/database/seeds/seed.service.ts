import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { ProductImage } from '../../products/entities/product-image.entity';
import { OptionType } from '../../products/entities/option-type.entity';
import { OptionValue } from '../../products/entities/option-value.entity';
import { VariantOptionValue } from '../../products/entities/variant-option-value.entity';
import { User } from '../../users/entities/user.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(OptionType)
    private optionTypeRepository: Repository<OptionType>,
    @InjectRepository(OptionValue)
    private optionValueRepository: Repository<OptionValue>,
    @InjectRepository(VariantOptionValue)
    private variantOptionValueRepository: Repository<VariantOptionValue>,
    private dataSource: DataSource,
  ) {}

  async seed() {
    this.logger.log('🌱 Bắt đầu seed cơ sở dữ liệu Apple & High-Tech...');

    // 1. Dọn dẹp dữ liệu cũ an toàn
    await this.clearData();

    // 2. Tạo tài khoản mẫu
    await this.seedUsers();
    this.logger.log('✅ Đã tạo mock users (admin và customer)');

    // 3. Tạo danh mục sản phẩm
    const categories = await this.seedCategories();
    this.logger.log(`✅ Đã tạo ${Object.keys(categories).length} danh mục sản phẩm`);

    // 4. Tạo Option Types
    const optionTypes = await this.seedOptionTypes();
    this.logger.log(`✅ Đã tạo ${Object.keys(optionTypes).length} loại tùy chọn (Option Types)`);

    // 5. Tạo Coupons mẫu
    await this.seedCoupons();
    this.logger.log('✅ Đã tạo các mã giảm giá (Coupons) mẫu');

    // 6. Tạo danh sách sản phẩm & ma trận biến thể
    const products = await this.seedProducts(categories, optionTypes);
    this.logger.log(`✅ Đã tạo thành công ${products.length} sản phẩm đầy đủ biến thể và hình ảnh chất lượng cao!`);

    this.logger.log('🎉 Quá trình seed dữ liệu hoàn tất 100%!');
  }

  private async clearData() {
    this.logger.log('🗑️ Xóa sạch dữ liệu cũ...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      const tables = [
        'coupon_usages',
        'coupons',
        'cart_items',
        'carts',
        'order_status_history',
        'order_items',
        'orders',
        'variant_option_values',
        'product_variants',
        'option_values',
        'option_types',
        'product_images',
        'products',
        'categories',
        'users',
      ];
      for (const table of tables) {
        try {
          await queryRunner.query(`TRUNCATE TABLE ${table}`);
        } catch {
          // Bỏ qua nếu bảng chưa tồn tại
        }
      }
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
      await queryRunner.release();
    }
  }

  private async seedUsers() {
    const userRepository = this.dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('Password123', 10);

    const admin = userRepository.create({
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Quản trị viên Hệ thống',
      phone: '0901234567',
      role: 'admin',
      status: 'active',
    });

    const customer = userRepository.create({
      email: 'user@example.com',
      password: hashedPassword,
      fullName: 'Nguyễn Văn Khách',
      phone: '0987654321',
      role: 'customer',
      status: 'active',
    });

    await userRepository.save(admin);
    await userRepository.save(customer);
  }

  private async seedCategories(): Promise<Record<string, Category>> {
    const categoriesData = [
      {
        name: 'Điện thoại',
        description: 'iPhone và điện thoại thông minh cao cấp chính hãng Apple',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
      },
      {
        name: 'Laptop',
        description: 'MacBook Pro, MacBook Air hiệu năng vượt trội với chip Apple Silicon',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
      },
      {
        name: 'Máy tính bảng',
        description: 'iPad Pro, iPad Air, iPad mini màn hình đỉnh cao cho sáng tạo và công việc',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600',
      },
      {
        name: 'Đồng hồ thông minh',
        description: 'Apple Watch Ultra, Series 9 theo dõi sức khỏe và thể thao đỉnh cao',
        image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600',
      },
      {
        name: 'Âm thanh',
        description: 'AirPods Pro, AirPods Max âm thanh không gian sống động và chống ồn chủ động',
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600',
      },
      {
        name: 'Phụ kiện',
        description: 'Củ sạc nhanh, cáp sạc MagSafe, ốp lưng và phụ kiện chính hãng Apple',
        image: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600',
      },
    ];

    const categoryMap: Record<string, Category> = {};
    for (const data of categoriesData) {
      const category = this.categoryRepository.create(data);
      const saved = await this.categoryRepository.save(category);
      categoryMap[data.name] = saved;
    }

    return categoryMap;
  }

  private async seedOptionTypes(): Promise<Record<string, OptionType>> {
    const typesData = [
      { name: 'Màu sắc', displayOrder: 1 },
      { name: 'Dung lượng', displayOrder: 2 },
      { name: 'RAM', displayOrder: 3 },
      { name: 'Ổ cứng SSD', displayOrder: 4 },
      { name: 'Kích thước', displayOrder: 5 },
      { name: 'Loại dây', displayOrder: 6 },
      { name: 'Cổng kết nối', displayOrder: 7 },
    ];

    const typeMap: Record<string, OptionType> = {};
    for (const t of typesData) {
      const optionType = this.optionTypeRepository.create(t);
      const saved = await this.optionTypeRepository.save(optionType);
      typeMap[t.name] = saved;
    }

    return typeMap;
  }

  private async seedCoupons() {
    const couponRepo = this.dataSource.getRepository(Coupon);
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 2, 11, 31);

    const coupons = [
      couponRepo.create({
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountAmount: 500000,
        minOrderValue: 200000,
        usageLimit: 1000,
        userUsageLimit: 1,
        startDate: new Date('2026-01-01'),
        endDate: nextYear,
        isActive: true,
      }),
      couponRepo.create({
        code: 'APPLE500K',
        discountType: 'fixed',
        discountValue: 500000,
        minOrderValue: 10000000,
        usageLimit: 200,
        userUsageLimit: 1,
        startDate: new Date('2026-01-01'),
        endDate: nextYear,
        isActive: true,
      }),
      couponRepo.create({
        code: 'TECH5',
        discountType: 'percentage',
        discountValue: 5,
        maxDiscountAmount: 1000000,
        minOrderValue: 5000000,
        usageLimit: 500,
        userUsageLimit: 2,
        startDate: new Date('2026-01-01'),
        endDate: nextYear,
        isActive: true,
      }),
    ];

    await couponRepo.save(coupons);
  }

  private async seedProducts(
    categories: Record<string, Category>,
    types: Record<string, OptionType>,
  ): Promise<Product[]> {
    const products: Product[] = [];

    // Helper tạo OptionValue
    const createOptionVal = async (
      type: OptionType,
      value: string,
      colorCode: string | null = null,
      imageUrl: string | null = null,
      displayOrder: number = 0,
    ): Promise<OptionValue> => {
      const ov = this.optionValueRepository.create({
        optionType: type,
        value,
        colorCode: colorCode ?? undefined,
        imageUrl: imageUrl ?? undefined,
        displayOrder,
      });
      return await this.optionValueRepository.save(ov);
    };

    // Helper tạo Variant và liên kết VariantOptionValue
    const createVariantWithValues = async (
      product: Product,
      sku: string,
      price: number,
      stock: number,
      optionValues: OptionValue[],
    ): Promise<ProductVariant> => {
      const variant = this.variantRepository.create({
        sku,
        price,
        stock,
        status: 'active',
        product,
      });
      const savedVariant = await this.variantRepository.save(variant);

      for (const ov of optionValues) {
        const vov = this.variantOptionValueRepository.create({
          variant: savedVariant,
          optionValue: ov,
        });
        await this.variantOptionValueRepository.save(vov);
      }
      return savedVariant;
    };

    // Helper thêm danh sách ProductImages
    const attachImages = async (product: Product, imageUrls: string[]) => {
      for (let i = 0; i < imageUrls.length; i++) {
        const img = this.productImageRepository.create({
          imageUrl: imageUrls[i],
          isPrimary: i === 0,
          displayOrder: i,
          product,
        });
        await this.productImageRepository.save(img);
      }
    };

    // =========================================================================
    // 1. iPhone 16 Pro Max
    // =========================================================================
    const ip16pm = await this.productRepository.save(
      this.productRepository.create({
        name: 'iPhone 16 Pro Max',
        description:
          'iPhone 16 Pro Max trang bị chip A18 Pro tiến trình 3nm thế hệ thứ hai với CPU 6 lõi và GPU 6 lõi, hỗ trợ Apple Intelligence đỉnh cao. Màn hình Super Retina XDR OLED 6.9 inch viền bezel siêu mỏng, tần số quét ProMotion 120Hz. Khung viền Titanium Cấp 5 hoàn thiện chải xước tinh xảo cùng nút bấm Điều Khiển Camera (Camera Control) xúc giác tiên tiến. Camera chính 48MP Fusion, góc siêu rộng 48MP và camera tele tiềm vọng 5x mang lại thước phim chuẩn điện ảnh 4K 120fps Dolby Vision.',
        basePrice: 34990000,
        status: 'active',
        category: categories['Điện thoại'],
      }),
    );
    await attachImages(ip16pm, [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1000',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1000',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1000',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000',
    ]);

    const ip16Colors = [
      {
        val: 'Desert Titanium',
        code: '#C3A68F',
        img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        tag: 'DES',
      },
      {
        val: 'Natural Titanium',
        code: '#9E978E',
        img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
        tag: 'NAT',
      },
      {
        val: 'White Titanium',
        code: '#F2F1ED',
        img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800',
        tag: 'WHT',
      },
      {
        val: 'Black Titanium',
        code: '#1D1D1F',
        img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
        tag: 'BLK',
      },
    ];
    const ip16Capacities = [
      { val: '256GB', price: 34990000, tag: '256' },
      { val: '512GB', price: 40990000, tag: '512' },
      { val: '1TB', price: 46990000, tag: '1TB' },
    ];

    const ip16ColorOvs = await Promise.all(
      ip16Colors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );
    const ip16CapOvs = await Promise.all(
      ip16Capacities.map((c, idx) =>
        createOptionVal(types['Dung lượng'], c.val, null, null, idx + 1),
      ),
    );

    for (let i = 0; i < ip16Colors.length; i++) {
      for (let j = 0; j < ip16Capacities.length; j++) {
        await createVariantWithValues(
          ip16pm,
          `IP16PM-${ip16Colors[i].tag}-${ip16Capacities[j].tag}`,
          ip16Capacities[j].price,
          35,
          [ip16ColorOvs[i], ip16CapOvs[j]],
        );
      }
    }
    products.push(ip16pm);

    // =========================================================================
    // 2. iPhone 15 Pro Max
    // =========================================================================
    const ip15pm = await this.productRepository.save(
      this.productRepository.create({
        name: 'iPhone 15 Pro Max',
        description:
          'iPhone 15 Pro Max đột phá với thiết kế khung Titanium hàng không vũ trụ chuẩn Grade 5, giúp trọng lượng giảm đáng kể và cảm giác cầm nắm thoải mái. Vi xử lý Apple A17 Pro hỗ trợ dò tia Ray Tracing phần cứng sống động. Nút Tác Vụ Action Button tùy biến linh hoạt, cổng sạc USB-C hỗ trợ truyền tải USB 3 tốc độ 10Gbps và ống kính tiềm vọng Zoom quang học 5x độc quyền.',
        basePrice: 29990000,
        status: 'active',
        category: categories['Điện thoại'],
      }),
    );
    await attachImages(ip15pm, [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1000',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1000',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1000',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000',
    ]);

    const ip15Colors = [
      {
        val: 'Natural Titanium',
        code: '#9E978E',
        img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        tag: 'NAT',
      },
      {
        val: 'Blue Titanium',
        code: '#4B6CB7',
        img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
        tag: 'BLU',
      },
      {
        val: 'White Titanium',
        code: '#F2F1ED',
        img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
        tag: 'WHT',
      },
      {
        val: 'Black Titanium',
        code: '#1D1D1F',
        img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
        tag: 'BLK',
      },
    ];
    const ip15Capacities = [
      { val: '256GB', price: 29990000, tag: '256' },
      { val: '512GB', price: 34990000, tag: '512' },
      { val: '1TB', price: 39990000, tag: '1TB' },
    ];

    const ip15ColorOvs = await Promise.all(
      ip15Colors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );
    const ip15CapOvs = await Promise.all(
      ip15Capacities.map((c, idx) =>
        createOptionVal(types['Dung lượng'], c.val, null, null, idx + 1),
      ),
    );

    for (let i = 0; i < ip15Colors.length; i++) {
      for (let j = 0; j < ip15Capacities.length; j++) {
        await createVariantWithValues(
          ip15pm,
          `IP15PM-${ip15Colors[i].tag}-${ip15Capacities[j].tag}`,
          ip15Capacities[j].price,
          40,
          [ip15ColorOvs[i], ip15CapOvs[j]],
        );
      }
    }
    products.push(ip15pm);

    // =========================================================================
    // 3. MacBook Pro 16 M3 Max
    // =========================================================================
    const mbp16 = await this.productRepository.save(
      this.productRepository.create({
        name: 'MacBook Pro 16 M3 Max',
        description:
          'MacBook Pro 16 inch sức mạnh quái thú với chip Apple M3 Max (16-core CPU, 40-core GPU, 16-core Neural Engine). Màn hình Liquid Retina XDR 16.2 inch độ phân giải 3456x2234, độ tương phản 1.000.000:1, độ sáng HDR đỉnh 1600 nits. Hệ thống 6 loa âm thanh trường rộng Dolby Atmos, 3 cổng Thunderbolt 4, cổng HDMI 8K, khe thẻ SDXC và sạc MagSafe 3 tiện lợi. Thời lượng pin đạt tới 22 giờ liên tục.',
        basePrice: 89990000,
        status: 'active',
        category: categories['Laptop'],
      }),
    );
    await attachImages(mbp16, [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1000',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1000',
    ]);

    const mbpColors = [
      {
        val: 'Space Black',
        code: '#2E2F32',
        img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        tag: 'SB',
      },
      {
        val: 'Silver',
        code: '#E3E4E5',
        img: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
        tag: 'SIL',
      },
    ];
    const mbpRams = [
      { val: '36GB', extraPrice: 0, tag: '36' },
      { val: '48GB', extraPrice: 12000000, tag: '48' },
      { val: '128GB', extraPrice: 35000000, tag: '128' },
    ];
    const mbpSsds = [
      { val: '512GB', extraPrice: 0, tag: '512' },
      { val: '1TB', extraPrice: 6000000, tag: '1TB' },
      { val: '2TB', extraPrice: 18000000, tag: '2TB' },
    ];

    const mbpColorOvs = await Promise.all(
      mbpColors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );
    const mbpRamOvs = await Promise.all(
      mbpRams.map((r, idx) =>
        createOptionVal(types['RAM'], r.val, null, null, idx + 1),
      ),
    );
    const mbpSsdOvs = await Promise.all(
      mbpSsds.map((s, idx) =>
        createOptionVal(types['Ổ cứng SSD'], s.val, null, null, idx + 1),
      ),
    );

    for (let c = 0; c < mbpColors.length; c++) {
      for (let r = 0; r < mbpRams.length; r++) {
        for (let s = 0; s < mbpSsds.length; s++) {
          const variantPrice =
            89990000 + mbpRams[r].extraPrice + mbpSsds[s].extraPrice;
          await createVariantWithValues(
            mbp16,
            `MBP16M3M-${mbpColors[c].tag}-${mbpRams[r].tag}-${mbpSsds[s].tag}`,
            variantPrice,
            15,
            [mbpColorOvs[c], mbpRamOvs[r], mbpSsdOvs[s]],
          );
        }
      }
    }
    products.push(mbp16);

    // =========================================================================
    // 4. MacBook Air 15 M3
    // =========================================================================
    const mba15 = await this.productRepository.save(
      this.productRepository.create({
        name: 'MacBook Air 15 M3',
        description:
          'MacBook Air 15.3 inch với chip Apple M3 cực kỳ mỏng nhẹ chỉ 11.5mm. Màn hình Liquid Retina 500 nits sống động với 1 tỷ màu, thiết kế không quạt hoạt động hoàn toàn tĩnh lặng. Hỗ trợ kết nối tối đa hai màn hình ngoài cùng thời lượng pin lên đến 18 giờ bền bỉ.',
        basePrice: 32990000,
        status: 'active',
        category: categories['Laptop'],
      }),
    );
    await attachImages(mba15, [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1000',
      'https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=1000',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1000',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1000',
    ]);

    const mbaColors = [
      {
        val: 'Midnight',
        code: '#191F26',
        img: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800',
        tag: 'MID',
      },
      {
        val: 'Starlight',
        code: '#F0E5D8',
        img: 'https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=800',
        tag: 'STA',
      },
      {
        val: 'Space Gray',
        code: '#535150',
        img: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800',
        tag: 'SGY',
      },
      {
        val: 'Silver',
        code: '#E3E4E5',
        img: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
        tag: 'SIL',
      },
    ];
    const mbaCapacities = [
      { val: '256GB', price: 32990000, tag: '256' },
      { val: '512GB', price: 37990000, tag: '512' },
    ];

    const mbaColorOvs = await Promise.all(
      mbaColors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );
    const mbaCapOvs = await Promise.all(
      mbaCapacities.map((c, idx) =>
        createOptionVal(types['Dung lượng'], c.val, null, null, idx + 1),
      ),
    );

    for (let c = 0; c < mbaColors.length; c++) {
      for (let cp = 0; cp < mbaCapacities.length; cp++) {
        await createVariantWithValues(
          mba15,
          `MBA15M3-${mbaColors[c].tag}-${mbaCapacities[cp].tag}`,
          mbaCapacities[cp].price,
          30,
          [mbaColorOvs[c], mbaCapOvs[cp]],
        );
      }
    }
    products.push(mba15);

    // =========================================================================
    // 5. iPad Pro M4
    // =========================================================================
    const ipadPro = await this.productRepository.save(
      this.productRepository.create({
        name: 'iPad Pro M4',
        description:
          'iPad Pro 13 inch đột phá với chip Apple M4 trên tiến trình 3nm, mang lại hiệu năng đồ họa cao hơn gấp 4 lần. Màn hình Ultra Retina XDR sử dụng công nghệ OLED hai lớp (Tandem OLED) cho độ sáng full-screen 1000 nits và peak 1600 nits. Thiết kế siêu mỏng nhẹ chỉ 5.1mm, mỏng nhất trong lịch sử sản phẩm Apple, tương thích bút Apple Pencil Pro cảm ứng xoay và phản hồi rung bóp.',
        basePrice: 28990000,
        status: 'active',
        category: categories['Máy tính bảng'],
      }),
    );
    await attachImages(ipadPro, [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1000',
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=1000',
      'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=1000',
    ]);

    const ipadColors = [
      {
        val: 'Space Black',
        code: '#2E2F32',
        img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
        tag: 'SB',
      },
      {
        val: 'Silver',
        code: '#E3E4E5',
        img: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800',
        tag: 'SIL',
      },
    ];
    const ipadCapacities = [
      { val: '256GB', price: 28990000, tag: '256' },
      { val: '512GB', price: 34490000, tag: '512' },
      { val: '1TB', price: 45990000, tag: '1TB' },
    ];

    const ipadColorOvs = await Promise.all(
      ipadColors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );
    const ipadCapOvs = await Promise.all(
      ipadCapacities.map((c, idx) =>
        createOptionVal(types['Dung lượng'], c.val, null, null, idx + 1),
      ),
    );

    for (let c = 0; c < ipadColors.length; c++) {
      for (let cp = 0; cp < ipadCapacities.length; cp++) {
        await createVariantWithValues(
          ipadPro,
          `IPADM4-${ipadColors[c].tag}-${ipadCapacities[cp].tag}`,
          ipadCapacities[cp].price,
          25,
          [ipadColorOvs[c], ipadCapOvs[cp]],
        );
      }
    }
    products.push(ipadPro);

    // =========================================================================
    // 6. Apple Watch Ultra 2
    // =========================================================================
    const awu2 = await this.productRepository.save(
      this.productRepository.create({
        name: 'Apple Watch Ultra 2',
        description:
          'Apple Watch Ultra 2 thiết kế vỏ Titanium 49mm chống ăn mòn siêu bền chuẩn quân đội MIL-STD 810H. Màn hình Retina Always-On sáng kỷ lục 3000 nits đọc rõ dưới ánh nắng gắt. Trang bị chip S9 SiP với tính năng chạm hai lần (Double Tap) kỳ diệu, GPS tần số kép độ chính xác hàng đầu thị trường, còi báo động khẩn cấp 86 decibel và khả năng lặn giải trí tới độ sâu 40 mét chuẩn EN13319.',
        basePrice: 21990000,
        status: 'active',
        category: categories['Đồng hồ thông minh'],
      }),
    );
    await attachImages(awu2, [
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=1000',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1000',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1000',
    ]);

    const awuColors = [
      {
        val: 'Natural Titanium',
        code: '#9E978E',
        img: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800',
        tag: 'NAT',
      },
      {
        val: 'Black Titanium',
        code: '#1D1D1F',
        img: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800',
        tag: 'BLK',
      },
    ];
    const awuStraps = [
      { val: 'Dây Alpine Loop', tag: 'ALP' },
      { val: 'Dây Trail Loop', tag: 'TRA' },
      { val: 'Dây Ocean Band', tag: 'OCE' },
    ];
    const awuSizeOv = await createOptionVal(types['Kích thước'], '49mm', null, null, 1);

    const awuColorOvs = await Promise.all(
      awuColors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );
    const awuStrapOvs = await Promise.all(
      awuStraps.map((s, idx) =>
        createOptionVal(types['Loại dây'], s.val, null, null, idx + 1),
      ),
    );

    for (let c = 0; c < awuColors.length; c++) {
      for (let s = 0; s < awuStraps.length; s++) {
        await createVariantWithValues(
          awu2,
          `AWU2-${awuColors[c].tag}-${awuStraps[s].tag}-49`,
          21990000,
          20,
          [awuColorOvs[c], awuStrapOvs[s], awuSizeOv],
        );
      }
    }
    products.push(awu2);

    // =========================================================================
    // 7. AirPods Pro 2 (USB-C)
    // =========================================================================
    const app2 = await this.productRepository.save(
      this.productRepository.create({
        name: 'AirPods Pro 2 (USB-C)',
        description:
          'AirPods Pro 2 trang bị chip Apple H2 mang đến khả năng Chủ Động Khử Tiếng Ồn (ANC) thông minh gấp 2 lần so với thế hệ trước. Tính năng Nhận Biết Cuộc Hội Thoại tự động giảm âm lượng khi bạn bắt đầu nói chuyện với người xung quanh. Hộp sạc MagSafe trang bị chip U1 tìm kiếm chính xác, loa phát tín hiệu và cổng sạc USB-C hiện đại, chống bụi và chống nước IP54.',
        basePrice: 6190000,
        status: 'active',
        category: categories['Âm thanh'],
      }),
    );
    await attachImages(app2, [
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1000',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1000',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=1000',
    ]);

    const appColorOv = await createOptionVal(
      types['Màu sắc'],
      'Trắng (White)',
      '#FFFFFF',
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800',
      1,
    );
    const appPortOv = await createOptionVal(types['Cổng kết nối'], 'USB-C', null, null, 1);

    await createVariantWithValues(
      app2,
      'APP2-USBC-WHT',
      6190000,
      100,
      [appColorOv, appPortOv],
    );
    products.push(app2);

    // =========================================================================
    // 8. AirPods Max
    // =========================================================================
    const apm = await this.productRepository.save(
      this.productRepository.create({
        name: 'AirPods Max',
        description:
          'Tai nghe over-ear thượng hạng AirPods Max kết hợp giữa âm thanh có độ trung thực cực cao Hi-Fi và tính năng Chủ Động Khử Tiếng Ồn hàng đầu ngành công nghiệp. Màng loa dynamic 40mm do Apple tự thiết kế tạo ra dải tần rộng với độ méo tiếng siêu thấp. Khung vòm bằng lưới thép không gỉ thoáng khí, đệm tai bằng bọt hoạt tính cách âm hoàn hảo cùng núm xoay Digital Crown điều khiển tinh tế.',
        basePrice: 13990000,
        status: 'active',
        category: categories['Âm thanh'],
      }),
    );
    await attachImages(apm, [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1000',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000',
    ]);

    const apmColors = [
      {
        val: 'Midnight',
        code: '#191F26',
        img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800',
        tag: 'MID',
      },
      {
        val: 'Starlight',
        code: '#F0E5D8',
        img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        tag: 'STA',
      },
      {
        val: 'Blue',
        code: '#2563EB',
        img: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
        tag: 'BLU',
      },
      {
        val: 'Orange',
        code: '#E05338',
        img: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800',
        tag: 'ORA',
      },
      {
        val: 'Purple',
        code: '#8B5CF6',
        img: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800',
        tag: 'PUR',
      },
    ];

    const apmColorOvs = await Promise.all(
      apmColors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );

    for (let c = 0; c < apmColors.length; c++) {
      await createVariantWithValues(
        apm,
        `APM-${apmColors[c].tag}`,
        13990000,
        25,
        [apmColorOvs[c]],
      );
    }
    products.push(apm);

    // =========================================================================
    // 9. Apple Watch Series 9
    // =========================================================================
    const aws9 = await this.productRepository.save(
      this.productRepository.create({
        name: 'Apple Watch Series 9',
        description:
          'Apple Watch Series 9 trang bị chip S9 SiP mạnh mẽ với 5.6 tỷ bóng bán dẫn, mang lại màn hình Retina sáng tới 2000 nits. Cảm biến đo nồng độ oxy trong máu SpO2, điện tâm đồ ECG và cảm biến nhiệt độ hỗ trợ theo dõi chu kỳ sức khỏe chuyên sâu.',
        basePrice: 10990000,
        status: 'active',
        category: categories['Đồng hồ thông minh'],
      }),
    );
    await attachImages(aws9, [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1000',
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=1000',
    ]);

    const awsColors = [
      {
        val: 'Midnight',
        code: '#191F26',
        img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800',
        tag: 'MID',
      },
      {
        val: 'Starlight',
        code: '#F0E5D8',
        img: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800',
        tag: 'STA',
      },
      {
        val: 'Silver',
        code: '#E3E4E5',
        img: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800',
        tag: 'SIL',
      },
    ];
    const awsSizes = [
      { val: '41mm', price: 10990000, tag: '41' },
      { val: '45mm', price: 11990000, tag: '45' },
    ];

    const awsColorOvs = await Promise.all(
      awsColors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );
    const awsSizeOvs = await Promise.all(
      awsSizes.map((s, idx) =>
        createOptionVal(types['Kích thước'], s.val, null, null, idx + 1),
      ),
    );

    for (let c = 0; c < awsColors.length; c++) {
      for (let s = 0; s < awsSizes.length; s++) {
        await createVariantWithValues(
          aws9,
          `AWS9-${awsColors[c].tag}-${awsSizes[s].tag}`,
          awsSizes[s].price,
          30,
          [awsColorOvs[c], awsSizeOvs[s]],
        );
      }
    }
    products.push(aws9);

    // =========================================================================
    // 10. Củ sạc nhanh Apple 20W USB-C
    // =========================================================================
    const adapter20w = await this.productRepository.save(
      this.productRepository.create({
        name: 'Củ sạc nhanh Apple 20W USB-C',
        description:
          'Củ sạc USB-C công suất 20W chính hãng Apple cho khả năng sạc nhanh an toàn vượt trội, nạp 50% pin cho iPhone chỉ trong 30 phút. Thiết kế chuẩn cắm công thái học, bảo vệ quá nhiệt và chống đoản mạch toàn diện.',
        basePrice: 590000,
        status: 'active',
        category: categories['Phụ kiện'],
      }),
    );
    await attachImages(adapter20w, [
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=1000',
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1000',
    ]);

    const adapterColorOv = await createOptionVal(
      types['Màu sắc'],
      'Trắng (White)',
      '#FFFFFF',
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800',
      1,
    );
    await createVariantWithValues(
      adapter20w,
      'ADAPTER-20W-WHT',
      590000,
      150,
      [adapterColorOv],
    );
    products.push(adapter20w);

    // =========================================================================
    // 11. Cáp sạc MagSafe 3 Apple (2m)
    // =========================================================================
    const magsafeCable = await this.productRepository.save(
      this.productRepository.create({
        name: 'Cáp sạc MagSafe 3 Apple (2m)',
        description:
          'Cáp sạc MagSafe 3 chính hãng với thiết kế bọc dù đan chéo tăng độ bền gấp nhiều lần, đầu kết nối từ tính tự hít nhạy bén và đèn LED hiển thị trạng thái sạc pin thông minh. Chiều dài tiêu chuẩn 2 mét tiện dụng.',
        basePrice: 1190000,
        status: 'active',
        category: categories['Phụ kiện'],
      }),
    );
    await attachImages(magsafeCable, [
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=1000',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=1000',
    ]);

    const msColors = [
      {
        val: 'Space Black',
        code: '#2E2F32',
        img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        tag: 'SB',
      },
      {
        val: 'Silver',
        code: '#E3E4E5',
        img: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
        tag: 'SIL',
      },
      {
        val: 'Midnight',
        code: '#191F26',
        img: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800',
        tag: 'MID',
      },
      {
        val: 'Starlight',
        code: '#F0E5D8',
        img: 'https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=800',
        tag: 'STA',
      },
    ];

    const msColorOvs = await Promise.all(
      msColors.map((c, idx) =>
        createOptionVal(types['Màu sắc'], c.val, c.code, c.img, idx + 1),
      ),
    );

    for (let c = 0; c < msColors.length; c++) {
      await createVariantWithValues(
        magsafeCable,
        `MAGSAFE3-${msColors[c].tag}`,
        1190000,
        80,
        [msColorOvs[c]],
      );
    }
    products.push(magsafeCable);

    return products;
  }
}
