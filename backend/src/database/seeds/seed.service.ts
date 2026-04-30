import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductImage } from '../../products/entities/product-image.entity';

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
    private dataSource: DataSource,
  ) {}

  async seed() {
    this.logger.log('🌱 Bắt đầu seed dữ liệu...');

    // Clear existing data
    await this.clearData();

    // Seed categories
    const categories = await this.seedCategories();
    this.logger.log(`✅ Đã tạo ${categories.length} categories`);

    // Seed products
    const products = await this.seedProducts(categories);
    this.logger.log(`✅ Đã tạo ${products.length} products`);

    this.logger.log('🎉 Seed dữ liệu hoàn tất!');
  }

  private async clearData() {
    this.logger.log('🗑️ Xóa dữ liệu cũ...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Tắt foreign key checks
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

      // Xóa dữ liệu
      await queryRunner.query('TRUNCATE TABLE product_images');
      await queryRunner.query('TRUNCATE TABLE products');
      await queryRunner.query('TRUNCATE TABLE categories');

      // Bật lại foreign key checks
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
      await queryRunner.release();
    }
  }

  private async seedCategories(): Promise<Category[]> {
    const categoriesData = [
      {
        name: 'Điện thoại',
        description:
          'Điện thoại thông minh các loại từ nhiều thương hiệu nổi tiếng',
        image:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      },
      {
        name: 'Laptop',
        description: 'Laptop văn phòng, gaming và đồ họa chất lượng cao',
        image:
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      },
      {
        name: 'Máy tính bảng',
        description: 'Tablet đa năng cho công việc và giải trí',
        image:
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
      },
      {
        name: 'Phụ kiện',
        description:
          'Phụ kiện điện tử: tai nghe, sạc, ốp lưng, và nhiều hơn nữa',
        image:
          'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400',
      },
      {
        name: 'Đồng hồ thông minh',
        description:
          'Smartwatch và đồng hồ thể thao từ các thương hiệu hàng đầu',
        image:
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      },
    ];

    const categories: Category[] = [];
    for (const data of categoriesData) {
      const category = this.categoryRepository.create(data);
      categories.push(await this.categoryRepository.save(category));
    }

    return categories;
  }

  private async seedProducts(categories: Category[]): Promise<Product[]> {
    const productsData = [
      // Điện thoại (category 0)
      {
        name: 'iPhone 15 Pro Max',
        description:
          'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình Super Retina XDR 6.7 inch. Thiết kế titanium sang trọng, pin dùng cả ngày.',
        price: 34990000,
        stock: 50,
        categoryIndex: 0,
        images: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
        ],
      },
      {
        name: 'iPhone 15',
        description:
          'iPhone 15 với Dynamic Island, camera 48MP, chip A16 Bionic mạnh mẽ. Màn hình Super Retina XDR 6.1 inch.',
        price: 24990000,
        stock: 80,
        categoryIndex: 0,
        images: [
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400',
        ],
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description:
          'Galaxy S24 Ultra với S Pen tích hợp, camera 200MP, chip Snapdragon 8 Gen 3. Màn hình Dynamic AMOLED 2X 6.8 inch.',
        price: 33990000,
        stock: 45,
        categoryIndex: 0,
        images: [
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
        ],
      },
      {
        name: 'Samsung Galaxy A54 5G',
        description:
          'Galaxy A54 5G với màn hình Super AMOLED 6.4 inch, camera 50MP, pin 5000mAh. Hiệu năng mạnh mẽ trong tầm giá.',
        price: 10990000,
        stock: 120,
        categoryIndex: 0,
        images: [
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400',
        ],
      },
      {
        name: 'Xiaomi 14 Ultra',
        description:
          'Xiaomi 14 Ultra với camera Leica chuyên nghiệp, chip Snapdragon 8 Gen 3. Màn hình LTPO AMOLED 6.73 inch.',
        price: 29990000,
        stock: 35,
        categoryIndex: 0,
        images: [
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
        ],
      },
      {
        name: 'OPPO Find X7 Ultra',
        description:
          'OPPO Find X7 Ultra với hệ thống camera Hasselblad, màn hình LTPO AMOLED 6.82 inch, sạc nhanh 100W.',
        price: 26990000,
        stock: 40,
        categoryIndex: 0,
        images: [
          'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
        ],
      },

      // Laptop (category 1)
      {
        name: 'MacBook Pro 14 M3 Pro',
        description:
          'MacBook Pro 14 inch với chip M3 Pro, RAM 18GB, SSD 512GB. Màn hình Liquid Retina XDR, thời lượng pin lên đến 17 giờ.',
        price: 49990000,
        stock: 25,
        categoryIndex: 1,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400',
        ],
      },
      {
        name: 'MacBook Air M3',
        description:
          'MacBook Air 13 inch với chip M3, RAM 8GB, SSD 256GB. Thiết kế mỏng nhẹ, pin dùng cả ngày, hoàn hảo cho công việc.',
        price: 27990000,
        stock: 60,
        categoryIndex: 1,
        images: [
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
        ],
      },
      {
        name: 'Dell XPS 15',
        description:
          'Dell XPS 15 với Intel Core i7 Gen 13, RAM 16GB, SSD 512GB. Màn hình OLED 15.6 inch 3.5K, card RTX 4050.',
        price: 42990000,
        stock: 20,
        categoryIndex: 1,
        images: [
          'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400',
        ],
      },
      {
        name: 'ASUS ROG Strix G16',
        description:
          'Laptop gaming ASUS ROG Strix G16 với RTX 4070, Intel Core i9, RAM 32GB. Màn hình 16 inch 240Hz.',
        price: 45990000,
        stock: 15,
        categoryIndex: 1,
        images: [
          'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
        ],
      },
      {
        name: 'Lenovo ThinkPad X1 Carbon',
        description:
          'ThinkPad X1 Carbon Gen 11 với Intel Core i7, RAM 16GB, SSD 512GB. Thiết kế doanh nhân, bàn phím tuyệt vời.',
        price: 38990000,
        stock: 30,
        categoryIndex: 1,
        images: [
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        ],
      },
      {
        name: 'HP Spectre x360',
        description:
          'HP Spectre x360 2-in-1 với màn hình cảm ứng OLED 14 inch, Intel Core i7, RAM 16GB. Thiết kế cao cấp.',
        price: 35990000,
        stock: 25,
        categoryIndex: 1,
        images: [
          'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400',
        ],
      },

      // Máy tính bảng (category 2)
      {
        name: 'iPad Pro M4 12.9 inch',
        description:
          'iPad Pro 12.9 inch với chip M4, màn hình Liquid Retina XDR, hỗ trợ Apple Pencil Pro. Mạnh mẽ như laptop.',
        price: 32990000,
        stock: 35,
        categoryIndex: 2,
        images: [
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        ],
      },
      {
        name: 'iPad Air M2',
        description:
          'iPad Air với chip M2, màn hình Liquid Retina 10.9 inch, hỗ trợ Apple Pencil và Magic Keyboard.',
        price: 18990000,
        stock: 50,
        categoryIndex: 2,
        images: [
          'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400',
        ],
      },
      {
        name: 'Samsung Galaxy Tab S9 Ultra',
        description:
          'Galaxy Tab S9 Ultra với màn hình Dynamic AMOLED 2X 14.6 inch, S Pen, chip Snapdragon 8 Gen 2.',
        price: 28990000,
        stock: 25,
        categoryIndex: 2,
        images: [
          'https://images.unsplash.com/photo-1632634417939-49b449c11c1f?w=400',
        ],
      },
      {
        name: 'iPad Mini 6',
        description:
          'iPad Mini 6 với chip A15 Bionic, màn hình Liquid Retina 8.3 inch. Nhỏ gọn, mạnh mẽ, dễ mang theo.',
        price: 14990000,
        stock: 45,
        categoryIndex: 2,
        images: [
          'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400',
        ],
      },

      // Phụ kiện (category 3)
      {
        name: 'AirPods Pro 2',
        description:
          'AirPods Pro thế hệ 2 với chip H2, chống ồn chủ động, âm thanh không gian. Hộp sạc MagSafe.',
        price: 6290000,
        stock: 100,
        categoryIndex: 3,
        images: [
          'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400',
        ],
      },
      {
        name: 'Samsung Galaxy Buds2 Pro',
        description:
          'Galaxy Buds2 Pro với chống ồn chủ động thông minh, âm thanh Hi-Fi 24-bit, chống nước IPX7.',
        price: 4990000,
        stock: 80,
        categoryIndex: 3,
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
        ],
      },
      {
        name: 'Sạc MagSafe Apple',
        description:
          'Bộ sạc MagSafe 15W chính hãng Apple, tương thích iPhone 12 trở lên. Sạc nhanh, tiện lợi.',
        price: 1190000,
        stock: 150,
        categoryIndex: 3,
        images: [
          'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=400',
        ],
      },
      {
        name: 'Anker PowerCore 20000mAh',
        description:
          'Pin dự phòng Anker 20000mAh với công nghệ PowerIQ, sạc nhanh 22.5W, 2 cổng USB-C.',
        price: 890000,
        stock: 200,
        categoryIndex: 3,
        images: [
          'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
        ],
      },

      // Đồng hồ thông minh (category 4)
      {
        name: 'Apple Watch Ultra 2',
        description:
          'Apple Watch Ultra 2 với vỏ titanium 49mm, GPS + Cellular, pin 36 giờ. Dành cho vận động viên.',
        price: 21990000,
        stock: 30,
        categoryIndex: 4,
        images: [
          'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400',
        ],
      },
      {
        name: 'Apple Watch Series 9',
        description:
          'Apple Watch Series 9 với chip S9 SiP, màn hình Always-On, theo dõi sức khỏe toàn diện.',
        price: 11990000,
        stock: 60,
        categoryIndex: 4,
        images: [
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
        ],
      },
      {
        name: 'Samsung Galaxy Watch 6 Classic',
        description:
          'Galaxy Watch 6 Classic với vòng bezel xoay, màn hình Super AMOLED, theo dõi sức khỏe nâng cao.',
        price: 9990000,
        stock: 45,
        categoryIndex: 4,
        images: [
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400',
        ],
      },
      {
        name: 'Garmin Fenix 7X',
        description:
          'Đồng hồ thể thao Garmin Fenix 7X với GPS đa băng tần, bản đồ TopoActive, pin lên đến 28 ngày.',
        price: 18990000,
        stock: 20,
        categoryIndex: 4,
        images: [
          'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400',
        ],
      },
    ];

    const products: Product[] = [];
    for (const data of productsData) {
      const { categoryIndex, images, ...productData } = data;

      // Create product
      const product = this.productRepository.create({
        ...productData,
        category: categories[categoryIndex],
      });
      const savedProduct = await this.productRepository.save(product);

      // Create product images
      for (let i = 0; i < images.length; i++) {
        const productImage = this.productImageRepository.create({
          imageUrl: images[i],
          isPrimary: i === 0,
          displayOrder: i,
          product: savedProduct,
        });
        await this.productImageRepository.save(productImage);
      }

      products.push(savedProduct);
    }

    return products;
  }
}
