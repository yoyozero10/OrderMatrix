import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';

describe('CouponsService', () => {
  let service: CouponsService;

  const mockCouponRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((coupon) => Promise.resolve({ id: 'coupon-uuid', ...coupon })),
  };

  const mockCouponUsageRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: getRepositoryToken(Coupon),
          useValue: mockCouponRepository,
        },
        {
          provide: getRepositoryToken(CouponUsage),
          useValue: mockCouponUsageRepository,
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    jest.clearAllMocks();
  });

  describe('calculateDiscount', () => {
    it('calculates percentage discount accurately', () => {
      const coupon = {
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 100000,
        maxDiscountAmount: null,
      } as Coupon;

      const discount = service.calculateDiscount(coupon, 200000);
      expect(discount).toBe(20000);
    });

    it('caps percentage discount at maxDiscountAmount', () => {
      const coupon = {
        discountType: 'percentage',
        discountValue: 50,
        minOrderValue: 0,
        maxDiscountAmount: 30000,
      } as Coupon;

      const discount = service.calculateDiscount(coupon, 200000);
      expect(discount).toBe(30000);
    });

    it('calculates fixed discount correctly', () => {
      const coupon = {
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 100000,
      } as Coupon;

      const discount = service.calculateDiscount(coupon, 150000);
      expect(discount).toBe(50000);
    });

    it('caps fixed discount at order total', () => {
      const coupon = {
        discountType: 'fixed',
        discountValue: 100000,
        minOrderValue: 0,
      } as Coupon;

      const discount = service.calculateDiscount(coupon, 60000);
      expect(discount).toBe(60000);
    });

    it('throws BadRequestException if order total is less than minOrderValue', () => {
      const coupon = {
        discountType: 'fixed',
        discountValue: 20000,
        minOrderValue: 100000,
      } as Coupon;

      expect(() => service.calculateDiscount(coupon, 50000)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('applyCoupon', () => {
    const validCoupon: Partial<Coupon> = {
      id: 'coupon-1',
      code: 'SUMMER2026',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 100000,
      maxDiscountAmount: 50000,
      usageLimit: 10,
      usedCount: 2,
      userUsageLimit: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    };

    it('successfully applies a valid coupon', async () => {
      mockCouponRepository.findOne.mockResolvedValue(validCoupon);
      mockCouponUsageRepository.count.mockResolvedValue(0);

      const result = await service.applyCoupon('user-1', 'SUMMER2026', 200000);

      expect(result).toEqual({
        coupon: validCoupon,
        code: 'SUMMER2026',
        discountType: 'percentage',
        discountValue: 20,
        discountAmount: 40000,
        finalAmount: 160000,
      });
    });

    it('throws NotFoundException if coupon does not exist', async () => {
      mockCouponRepository.findOne.mockResolvedValue(null);

      await expect(
        service.applyCoupon('user-1', 'NOTFOUND', 200000),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException if coupon is inactive', async () => {
      mockCouponRepository.findOne.mockResolvedValue({
        ...validCoupon,
        isActive: false,
      });

      await expect(
        service.applyCoupon('user-1', 'SUMMER2026', 200000),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException if coupon has not started yet', async () => {
      mockCouponRepository.findOne.mockResolvedValue({
        ...validCoupon,
        startDate: new Date(Date.now() + 86400000), // tomorrow
      });

      await expect(
        service.applyCoupon('user-1', 'SUMMER2026', 200000),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException if coupon is expired', async () => {
      mockCouponRepository.findOne.mockResolvedValue({
        ...validCoupon,
        endDate: new Date('2020-01-01'),
      });

      await expect(
        service.applyCoupon('user-1', 'SUMMER2026', 200000),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException if total usage limit is exceeded', async () => {
      mockCouponRepository.findOne.mockResolvedValue({
        ...validCoupon,
        usageLimit: 5,
        usedCount: 5,
      });

      await expect(
        service.applyCoupon('user-1', 'SUMMER2026', 200000),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException if user usage limit is reached', async () => {
      mockCouponRepository.findOne.mockResolvedValue(validCoupon);
      mockCouponUsageRepository.count.mockResolvedValue(1); // userUsageLimit is 1

      await expect(
        service.applyCoupon('user-1', 'SUMMER2026', 200000),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createCoupon', () => {
    it('creates a new coupon with uppercase code', async () => {
      mockCouponRepository.findOne.mockResolvedValue(null);

      const dto = {
        code: 'welcome50',
        discountType: 'fixed' as const,
        discountValue: 50000,
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
      };

      const result = await service.createCoupon(dto);
      expect(result.code).toBe('WELCOME50');
      expect(mockCouponRepository.save).toHaveBeenCalled();
    });

    it('throws ConflictException if code already exists', async () => {
      mockCouponRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createCoupon({
          code: 'EXISTING',
          discountType: 'fixed',
          discountValue: 10000,
          startDate: '2026-03-01',
          endDate: '2026-12-31',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws BadRequestException if startDate is after endDate', async () => {
      mockCouponRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createCoupon({
          code: 'INVALIDDATES',
          discountType: 'fixed',
          discountValue: 10000,
          startDate: '2026-12-31',
          endDate: '2026-01-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException if percentage discountValue is greater than 100', async () => {
      mockCouponRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createCoupon({
          code: 'OVER100',
          discountType: 'percentage',
          discountValue: 150,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('toggleCoupon', () => {
    it('toggles coupon active status', async () => {
      const coupon = {
        id: 'coupon-1',
        code: 'TEST',
        isActive: true,
      };
      mockCouponRepository.findOne.mockResolvedValue(coupon);

      const result = await service.toggleCoupon('coupon-1');
      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException if coupon not found', async () => {
      mockCouponRepository.findOne.mockResolvedValue(null);

      await expect(service.toggleCoupon('not-exist')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getAllCoupons', () => {
    it('returns all coupons ordered by createdAt DESC', async () => {
      mockCouponRepository.find.mockResolvedValue([{ id: 'c-1' }, { id: 'c-2' }]);
      const result = await service.getAllCoupons();
      expect(result).toHaveLength(2);
      expect(mockCouponRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });
});
