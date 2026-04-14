import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategory = {
    id: 'cat-1',
    name: 'Điện thoại',
    description: 'Các loại điện thoại thông minh',
    image: 'https://example.com/phone.jpg',
    products: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const categoryRepositoryMock = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: categoryRepositoryMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  // ============================================================
  // findAll
  // ============================================================
  describe('findAll', () => {
    it('trả về danh sách categories kèm productCount', async () => {
      const mockQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockCategory],
          raw: [{ productCount: '5' }],
        }),
      };
      categoryRepositoryMock.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'cat-1', name: 'Điện thoại', productCount: 5 });
    });

    it('trả về productCount = 0 khi không có sản phẩm', async () => {
      const mockQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockCategory],
          raw: [{ productCount: '0' }],
        }),
      };
      categoryRepositoryMock.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll();

      expect(result[0].productCount).toBe(0);
    });
  });

  // ============================================================
  // createCategory
  // ============================================================
  describe('createCategory', () => {
    it('tạo danh mục thành công', async () => {
      categoryRepositoryMock.create.mockReturnValue(mockCategory);
      categoryRepositoryMock.save.mockResolvedValue(mockCategory);

      const result = await service.createCategory({
        name: 'Điện thoại',
        description: 'Các loại điện thoại thông minh',
      });

      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Điện thoại');
      expect(categoryRepositoryMock.save).toHaveBeenCalled();
    });
  });

  // ============================================================
  // updateCategory
  // ============================================================
  describe('updateCategory', () => {
    it('cập nhật danh mục thành công', async () => {
      const updatedCategory = { ...mockCategory, name: 'Laptop' };
      categoryRepositoryMock.findOne.mockResolvedValue({ ...mockCategory });
      categoryRepositoryMock.save.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory('cat-1', { name: 'Laptop' });

      expect(result.name).toBe('Laptop');
      expect(categoryRepositoryMock.save).toHaveBeenCalled();
    });

    it('ném NotFoundException khi danh mục không tồn tại', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.updateCategory('invalid-id', { name: 'New Name' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ============================================================
  // removeCategory
  // ============================================================
  describe('removeCategory', () => {
    it('xóa danh mục thành công khi không có sản phẩm', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({ ...mockCategory, products: [] });
      categoryRepositoryMock.remove.mockResolvedValue(undefined);

      const result = await service.removeCategory('cat-1');

      expect(result).toEqual({ message: 'Xóa danh mục thành công' });
      expect(categoryRepositoryMock.remove).toHaveBeenCalled();
    });

    it('ném BadRequestException khi danh mục đang có sản phẩm', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue({
        ...mockCategory,
        products: [{ id: 'prod-1', name: 'iPhone 15' }],
      });

      await expect(service.removeCategory('cat-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ném NotFoundException khi danh mục không tồn tại', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.removeCategory('invalid-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
