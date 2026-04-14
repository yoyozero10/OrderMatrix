import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '../categories/entities/category.entity';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProduct = {
    id: 'prod-1',
    name: 'iPhone 15',
    description: 'Điện thoại Apple',
    price: 24990000,
    stock: 50,
    status: 'active',
    category: { id: 'cat-1', name: 'Điện thoại' },
    images: [{ id: 'img-1', imageUrl: 'https://example.com/img.jpg', isPrimary: true, displayOrder: 0 }],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockCategory = { id: 'cat-1', name: 'Điện thoại' };

  const productRepositoryMock = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const productImageRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const categoryRepositoryMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepositoryMock },
        { provide: getRepositoryToken(ProductImage), useValue: productImageRepositoryMock },
        { provide: getRepositoryToken(Category), useValue: categoryRepositoryMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  // ============================================================
  // findAll
  // ============================================================
  describe('findAll', () => {
    it('trả về danh sách sản phẩm cùng meta phân trang', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ id: 'prod-1', name: 'iPhone 15' });
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });
  });

  // ============================================================
  // findOne
  // ============================================================
  describe('findOne', () => {
    it('trả về sản phẩm khi tìm thấy', async () => {
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-1');

      expect(result.id).toBe('prod-1');
      expect(result.name).toBe('iPhone 15');
      expect(result.images).toHaveLength(1);
    });

    it('ném NotFoundException khi sản phẩm không tồn tại', async () => {
      productRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ============================================================
  // createProduct
  // ============================================================
  describe('createProduct', () => {
    it('tạo sản phẩm thành công khi category tồn tại', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(mockCategory);
      productRepositoryMock.create.mockReturnValue({ ...mockProduct });
      productRepositoryMock.save.mockResolvedValue({ id: 'prod-1' });
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);

      const result = await service.createProduct({
        name: 'iPhone 15',
        description: 'Điện thoại Apple',
        price: 24990000,
        stock: 50,
        categoryId: 'cat-1',
      });

      expect(result.id).toBe('prod-1');
      expect(categoryRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });

    it('ném BadRequestException khi category không tồn tại', async () => {
      categoryRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.createProduct({
          name: 'Test',
          description: 'Desc',
          price: 100,
          stock: 10,
          categoryId: 'nonexistent-cat',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ============================================================
  // updateProduct
  // ============================================================
  describe('updateProduct', () => {
    it('cập nhật sản phẩm thành công', async () => {
      const updatedProduct = { ...mockProduct, name: 'iPhone 15 Pro' };
      productRepositoryMock.findOne
        .mockResolvedValueOnce(mockProduct) // tìm product để update
        .mockResolvedValueOnce(updatedProduct); // findOne sau khi save
      productRepositoryMock.save.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct('prod-1', { name: 'iPhone 15 Pro' });

      expect(result.name).toBe('iPhone 15 Pro');
      expect(productRepositoryMock.save).toHaveBeenCalled();
    });

    it('ném NotFoundException khi sản phẩm không tồn tại', async () => {
      productRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.updateProduct('invalid-id', { name: 'New Name' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ============================================================
  // removeProduct
  // ============================================================
  describe('removeProduct', () => {
    it('xóa sản phẩm thành công', async () => {
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      productRepositoryMock.remove.mockResolvedValue(undefined);

      const result = await service.removeProduct('prod-1');

      expect(result).toEqual({ message: 'Xóa sản phẩm thành công' });
      expect(productRepositoryMock.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('ném NotFoundException khi sản phẩm không tồn tại', async () => {
      productRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.removeProduct('invalid-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
