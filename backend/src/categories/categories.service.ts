import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * Lấy tất cả categories, sắp xếp theo tên
   * Bao gồm số lượng products trong mỗi category
   */
  async findAll(): Promise<any[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product')
      .select([
        'category.id',
        'category.name',
        'category.description',
        'category.image',
        'category.createdAt',
        'category.updatedAt',
      ])
      .addSelect('COUNT(product.id)', 'productCount')
      .groupBy('category.id')
      .orderBy('category.name', 'ASC')
      .getRawAndEntities();

    // Merge entity data with productCount
    return categories.entities.map((category, index) => ({
      ...category,
      productCount: parseInt(categories.raw[index].productCount) || 0,
    }));
  }

  /**
   * Tìm category theo ID
   */
  async findOne(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({ where: { id } });
  }

  // =============================================
  // ADMIN METHODS
  // =============================================

  /**
   * API 27/37: POST /admin/categories [MVP]
   * Tạo danh mục mới
   */
  async createCategory(dto: CreateCategoryDto): Promise<any> {
    const category = this.categoryRepository.create({
      name: dto.name,
      description: dto.description,
      image: dto.image,
    });

    const saved = await this.categoryRepository.save(category);
    return saved;
  }

  /**
   * API 28/37: PUT /admin/categories/:id [MVP]
   * Cập nhật danh mục
   */
  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<any> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'CATEGORY_NOT_FOUND',
        message: 'Không tìm thấy danh mục',
      });
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.image !== undefined) category.image = dto.image;

    return this.categoryRepository.save(category);
  }

  /**
   * API 29/37: DELETE /admin/categories/:id [MVP]
   * Xóa danh mục (chặn nếu có products)
   */
  async removeCategory(id: string): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'CATEGORY_NOT_FOUND',
        message: 'Không tìm thấy danh mục',
      });
    }

    // Check if category has products
    if (category.products && category.products.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'CATEGORY_HAS_PRODUCTS',
        message: `Không thể xóa danh mục "${category.name}" vì đang có ${category.products.length} sản phẩm`,
      });
    }

    await this.categoryRepository.remove(category);
    return { message: 'Xóa danh mục thành công' };
  }
}
