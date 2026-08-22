import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { OptionType } from './entities/option-type.entity';
import { OptionValue } from './entities/option-value.entity';
import { VariantOptionValue } from './entities/variant-option-value.entity';
import { Category } from '../categories/entities/category.entity';
import {
  GetProductsDto,
  ProductSortBy,
  CreateProductDto,
  UpdateProductDto,
  AddProductImageDto,
} from './dto';
import { GenerateVariantsDto } from './dto/generate-variants.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

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
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(OptionType)
    private optionTypeRepository: Repository<OptionType>,
    @InjectRepository(OptionValue)
    private optionValueRepository: Repository<OptionValue>,
    @InjectRepository(VariantOptionValue)
    private variantOptionValueRepository: Repository<VariantOptionValue>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
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

    // Filter by price range (using basePrice)
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.basePrice >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.basePrice <= :maxPrice', { maxPrice });
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
      basePrice: Number(product.basePrice),
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
   * Lấy chi tiết sản phẩm với options và variants (Shopee-style)
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

    // Load variants với optionValues
    const variants = await this.variantRepository.find({
      where: { product: { id } },
      relations: [
        'optionValues',
        'optionValues.optionValue',
        'optionValues.optionValue.optionType',
      ],
      order: { createdAt: 'ASC' },
    });

    // Sort images by displayOrder
    const sortedImages =
      product.images?.sort((a, b) => a.displayOrder - b.displayOrder) || [];

    // Build options[] grouped by optionType
    const optionsMap = new Map<
      string,
      {
        id: string;
        name: string;
        displayOrder: number;
        values: Map<string, any>;
      }
    >();

    for (const variant of variants) {
      for (const vov of variant.optionValues ?? []) {
        const ov = vov.optionValue;
        if (!ov || !ov.optionType) continue;

        const typeId = ov.optionType.id;
        if (!optionsMap.has(typeId)) {
          optionsMap.set(typeId, {
            id: typeId,
            name: ov.optionType.name,
            displayOrder: ov.optionType.displayOrder,
            values: new Map(),
          });
        }

        const typeEntry = optionsMap.get(typeId)!;
        if (!typeEntry.values.has(ov.id)) {
          typeEntry.values.set(ov.id, {
            id: ov.id,
            value: ov.value,
            colorCode: ov.colorCode ?? null,
            imageUrl: ov.imageUrl ?? null,
            displayOrder: ov.displayOrder,
          });
        }
      }
    }

    const options = Array.from(optionsMap.values())
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((type) => ({
        id: type.id,
        name: type.name,
        displayOrder: type.displayOrder,
        values: Array.from(type.values.values()).sort(
          (a, b) => a.displayOrder - b.displayOrder,
        ),
      }));

    // Format variants
    const formattedVariants = variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: Number(variant.price),
      stock: variant.stock,
      status: variant.status,
      optionValues: (variant.optionValues ?? []).map((vov) => ({
        optionType: vov.optionValue?.optionType?.name ?? '',
        optionTypeId: vov.optionValue?.optionType?.id ?? '',
        value: vov.optionValue?.value ?? '',
        valueId: vov.optionValue?.id ?? '',
      })),
    }));

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: Number(product.basePrice),
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
      options,
      variants: formattedVariants,
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
        queryBuilder.orderBy('product.basePrice', 'ASC');
        break;
      case ProductSortBy.PRICE_DESC:
        queryBuilder.orderBy('product.basePrice', 'DESC');
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
   * Tạo sản phẩm mới (không cần price/stock, chỉ tạo shell)
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
      basePrice: 0,
      status: dto.status || 'active',
      category: { id: dto.categoryId } as Category,
    });

    const savedProduct = await this.productRepository.save(product);
    return this.findOne(savedProduct.id);
  }

  /**
   * API 23/37: PUT /admin/products/:id [MVP]
   * Cập nhật sản phẩm (tên, mô tả, danh mục, status — không cập nhật giá)
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
    if (dto.status !== undefined) product.status = dto.status;

    await this.productRepository.save(product);
    return this.findOne(id);
  }

  /**
   * API 24/37: DELETE /admin/products/:id [MVP]
   * Xóa sản phẩm (hard delete, variants + images cascade)
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

  // =============================================
  // VARIANT MANAGEMENT
  // =============================================

  /**
   * POST /admin/products/:id/variants/generate
   * Generate variant matrix theo Cartesian product của các option values
   */
  async generateVariants(
    productId: string,
    dto: GenerateVariantsDto,
  ): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm',
      });
    }

    // Validate all option types and values exist
    const optionData: Array<{ typeId: string; values: OptionValue[] }> = [];
    for (const option of dto.options) {
      const optionType = await this.optionTypeRepository.findOne({
        where: { id: option.optionTypeId },
      });
      if (!optionType) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'OPTION_TYPE_NOT_FOUND',
          message: `Option type ${option.optionTypeId} không tồn tại`,
        });
      }

      const values = await this.optionValueRepository.findByIds(
        option.optionValueIds,
      );
      if (values.length !== option.optionValueIds.length) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'OPTION_VALUE_NOT_FOUND',
          message: `Một số option value không tồn tại trong type "${optionType.name}"`,
        });
      }

      optionData.push({ typeId: option.optionTypeId, values });
    }

    // Compute Cartesian product of option values
    const combinations = this.cartesianProduct(
      optionData.map((o) => o.values),
    );

    // Check for existing variants to avoid duplicates
    const existingVariants = await this.variantRepository.find({
      where: { product: { id: productId } },
      relations: ['optionValues', 'optionValues.optionValue'],
    });

    const createdVariants: ProductVariant[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const combo of combinations) {
        // Sort combo by displayOrder for consistent SKU generation
        const sortedCombo = [...combo].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        );

        // Check if this exact combination already exists
        const isDuplicate = existingVariants.some((v) => {
          const existingValueIds = (v.optionValues ?? [])
            .map((vov) => vov.optionValue?.id)
            .sort();
          const newValueIds = sortedCombo.map((ov) => ov.id).sort();
          return JSON.stringify(existingValueIds) === JSON.stringify(newValueIds);
        });

        if (isDuplicate) continue;

        // Generate SKU from product name + option values
        const sku = this.generateSku(product.name, sortedCombo);

        // Create variant
        const variant = manager.create(ProductVariant, {
          sku,
          price: 0,
          stock: 0,
          status: 'active',
          product: { id: productId } as Product,
        });
        const savedVariant = await manager.save(ProductVariant, variant);

        // Create VariantOptionValue junction rows
        for (const optionValue of sortedCombo) {
          const vov = manager.create(VariantOptionValue, {
            variant: { id: savedVariant.id } as ProductVariant,
            optionValue: { id: optionValue.id } as OptionValue,
          });
          await manager.save(VariantOptionValue, vov);
        }

        createdVariants.push(savedVariant);
      }
    });

    return this.findOne(productId);
  }

  /**
   * PUT /admin/products/:id/variants/:variantId
   * Cập nhật giá / stock / SKU / status của một variant
   */
  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<any> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, product: { id: productId } },
    });

    if (!variant) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'VARIANT_NOT_FOUND',
        message: 'Không tìm thấy variant',
      });
    }

    if (dto.sku !== undefined) variant.sku = dto.sku;
    if (dto.price !== undefined) variant.price = dto.price;
    if (dto.stock !== undefined) variant.stock = dto.stock;
    if (dto.status !== undefined) variant.status = dto.status;

    await this.variantRepository.save(variant);

    // Recalculate basePrice if price changed
    if (dto.price !== undefined) {
      await this.updateBasePrice(productId);
    }

    return this.findOne(productId);
  }

  /**
   * DELETE /admin/products/:id/variants/:variantId
   * Xóa một variant
   */
  async deleteVariant(productId: string, variantId: string): Promise<any> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, product: { id: productId } },
    });

    if (!variant) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'VARIANT_NOT_FOUND',
        message: 'Không tìm thấy variant',
      });
    }

    await this.variantRepository.remove(variant);
    await this.updateBasePrice(productId);

    return this.findOne(productId);
  }

  // =============================================
  // PRIVATE HELPERS
  // =============================================

  /**
   * Cập nhật basePrice của product = MIN(variant.price) với price > 0
   */
  private async updateBasePrice(productId: string): Promise<void> {
    const result = await this.variantRepository
      .createQueryBuilder('variant')
      .select('MIN(variant.price)', 'minPrice')
      .where('variant.productId = :productId', { productId })
      .andWhere('variant.status = :status', { status: 'active' })
      .andWhere('variant.price > 0')
      .getRawOne();

    const basePrice = result?.minPrice ? Number(result.minPrice) : 0;

    await this.productRepository.update({ id: productId }, { basePrice });
  }

  /**
   * Cartesian product của mảng mảng
   * [[A, B], [X, Y]] → [[A,X], [A,Y], [B,X], [B,Y]]
   */
  private cartesianProduct<T>(arrays: T[][]): T[][] {
    return arrays.reduce<T[][]>(
      (acc, curr) => {
        const result: T[][] = [];
        for (const a of acc) {
          for (const c of curr) {
            result.push([...a, c]);
          }
        }
        return result;
      },
      [[]],
    );
  }

  /**
   * Generate SKU từ tên sản phẩm + option values
   * e.g. "iPhone 15 Pro Max" + ["Xanh Titan", "256GB"] → "IP15PM-XTI-256"
   */
  private generateSku(productName: string, optionValues: OptionValue[]): string {
    // Tạo prefix từ tên sản phẩm (lấy chữ hoa đầu từng từ)
    const prefix = productName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.substring(0, 2))
      .join('')
      .substring(0, 6);

    // Tạo suffix từ option values (lấy 3 ký tự đầu của mỗi value)
    const suffix = optionValues
      .map((ov) =>
        ov.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 3),
      )
      .join('-');

    const baseSku = `${prefix}-${suffix}`;

    return baseSku.substring(0, 50); // max length safety
  }
}
