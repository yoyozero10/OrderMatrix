import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '../categories/entities/category.entity';
import {
  GetProductsDto,
  ProductSortBy,
  CreateProductDto,
  UpdateProductDto,
  AddProductImageDto,
} from './dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * API 11/37: GET /products [MVP]
   * Lấy danh sách sản phẩm với pagination, search, filter, sort
   */
  async findAll(query: GetProductsDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy,
    } = query;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoin('product.images', 'image', 'image.isPrimary = :isPrimary', {
        isPrimary: true,
      })
      .addSelect(['image.id', 'image.imageUrl', 'image.isPrimary'])
      .where('product.status = :status', { status: 'active' });

    // Search by name or description
    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by category
    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }

    // Filter by price range
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Sorting
    this.applySorting(queryBuilder, sortBy);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const products = await queryBuilder.getMany();

    // Format response
    const data = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : null,
      primaryImage: product.images?.[0]?.imageUrl || null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * API 12/37: GET /products/:id [MVP]
   * Lấy chi tiết sản phẩm với tất cả images
   */
  async findOne(id: string): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'images'],
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm',
      });
    }

    // Sort images by displayOrder
    const sortedImages =
      product.images?.sort((a, b) => a.displayOrder - b.displayOrder) || [];

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            description: product.category.description,
          }
        : null,
      images: sortedImages.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    sortBy?: ProductSortBy,
  ): void {
    switch (sortBy) {
      case ProductSortBy.PRICE_ASC:
        queryBuilder.orderBy('product.price', 'ASC');
        break;
      case ProductSortBy.PRICE_DESC:
        queryBuilder.orderBy('product.price', 'DESC');
        break;
      case ProductSortBy.NAME_ASC:
        queryBuilder.orderBy('product.name', 'ASC');
        break;
      case ProductSortBy.NEWEST:
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
    }
  }

  // =============================================
  // ADMIN METHODS
  // =============================================

  /**
   * API 22/37: POST /admin/products [MVP]
   * Tạo sản phẩm mới
   */
  async createProduct(dto: CreateProductDto): Promise<any> {
    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'CATEGORY_NOT_FOUND',
        message: 'Danh mục không tồn tại',
      });
    }

    const product = this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      status: dto.status || 'active',
      category: { id: dto.categoryId } as Category,
    });

    const savedProduct = await this.productRepository.save(product);
    return this.findOne(savedProduct.id);
  }

  /**
   * API 23/37: PUT /admin/products/:id [MVP]
   * Cập nhật sản phẩm
   */
  async updateProduct(id: string, dto: UpdateProductDto): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm',
      });
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'CATEGORY_NOT_FOUND',
          message: 'Danh mục không tồn tại',
        });
      }
      product.category = { id: dto.categoryId } as Category;
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.status !== undefined) product.status = dto.status;

    await this.productRepository.save(product);
    return this.findOne(id);
  }

  /**
   * API 24/37: DELETE /admin/products/:id [MVP]
   * Xóa sản phẩm (hard delete, images cascade)
   */
  async removeProduct(id: string): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm',
      });
    }

    await this.productRepository.remove(product);
    return { message: 'Xóa sản phẩm thành công' };
  }

  /**
   * API 25/37: POST /admin/products/:id/images [Optional]
   * Thêm ảnh cho sản phẩm
   */
  async addProductImage(
    productId: string,
    dto: AddProductImageDto,
  ): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['images'],
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm',
      });
    }

    // Nếu là ảnh đầu tiên hoặc isPrimary = true → set isPrimary
    const isFirstImage = !product.images || product.images.length === 0;
    const shouldBePrimary = isFirstImage || dto.isPrimary === true;

    // Nếu set primary mới, reset primary cũ
    if (shouldBePrimary && !isFirstImage) {
      await this.productImageRepository.update(
        { product: { id: productId } },
        { isPrimary: false },
      );
    }

    const image = this.productImageRepository.create({
      imageUrl: dto.imageUrl,
      isPrimary: shouldBePrimary,
      displayOrder: dto.displayOrder ?? product.images.length,
      product: { id: productId } as Product,
    });

    await this.productImageRepository.save(image);
    return this.findOne(productId);
  }

  /**
   * API 26/37: DELETE /admin/products/:id/images/:imageId [Optional]
   * Xóa ảnh sản phẩm
   */
  async removeProductImage(productId: string, imageId: string): Promise<any> {
    const image = await this.productImageRepository.findOne({
      where: { id: imageId, product: { id: productId } },
    });

    if (!image) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'IMAGE_NOT_FOUND',
        message: 'Không tìm thấy ảnh',
      });
    }

    const wasPrimary = image.isPrimary;
    await this.productImageRepository.remove(image);

    // Nếu ảnh vừa xóa là primary → set ảnh khác làm primary
    if (wasPrimary) {
      const firstImage = await this.productImageRepository.findOne({
        where: { product: { id: productId } },
        order: { displayOrder: 'ASC' },
      });
      if (firstImage) {
        firstImage.isPrimary = true;
        await this.productImageRepository.save(firstImage);
      }
    }

    return this.findOne(productId);
  }
}
