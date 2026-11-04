import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
  ) {}

  calculateDiscount(coupon: Coupon, orderTotal: number): number {
    const minOrderValue = Number(coupon.minOrderValue || 0);
    if (orderTotal < minOrderValue) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'COUPON_MIN_ORDER_VALUE',
        message: `Đơn hàng tối thiểu phải từ ${minOrderValue.toLocaleString()}đ để áp dụng mã giảm giá`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderTotal * Number(coupon.discountValue)) / 100;
      if (
        coupon.maxDiscountAmount !== null &&
        coupon.maxDiscountAmount !== undefined
      ) {
        discount = Math.min(discount, Number(coupon.maxDiscountAmount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, orderTotal);
    return Math.max(0, Math.round(discount * 100) / 100);
  }

  async getActiveCoupons(): Promise<Coupon[]> {
    const coupons = await this.couponRepository.find({
      where: { isActive: true },
      order: { discountValue: 'DESC' },
    });
    const now = new Date();
    return coupons.filter((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      const withinDate = now >= start && now <= end;
      const withinLimit =
        c.usageLimit === null ||
        c.usageLimit === undefined ||
        c.usedCount < c.usageLimit;
      return withinDate && withinLimit;
    });
  }

  async applyCoupon(
    userId: string,
    code: string,
    orderTotal: number,
  ): Promise<{
    coupon: Coupon;
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
  }> {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await this.couponRepository.findOne({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'COUPON_NOT_FOUND',
        message: 'Mã giảm giá không tồn tại',
      });
    }

    if (!coupon.isActive) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'COUPON_INACTIVE',
        message: 'Mã giảm giá hiện không hoạt động',
      });
    }

    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'COUPON_NOT_STARTED',
        message: 'Mã giảm giá chưa đến thời gian áp dụng',
      });
    }

    if (now > new Date(coupon.endDate)) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'COUPON_EXPIRED',
        message: 'Mã giảm giá đã hết hạn',
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'COUPON_USAGE_LIMIT_EXCEEDED',
        message: 'Mã giảm giá đã hết lượt sử dụng',
      });
    }

    const userUsageLimit = coupon.userUsageLimit ?? 1;
    const userUsageCount = await this.couponUsageRepository.count({
      where: {
        coupon: { id: coupon.id },
        user: { id: userId },
      },
    });

    if (userUsageCount >= userUsageLimit) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'COUPON_USER_LIMIT_EXCEEDED',
        message: 'Bạn đã hết lượt sử dụng mã giảm giá này',
      });
    }

    const discountAmount = this.calculateDiscount(coupon, orderTotal);
    const finalAmount = Math.max(0, orderTotal - discountAmount);

    return {
      coupon,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount,
      finalAmount,
    };
  }

  async createCoupon(dto: CreateCouponDto): Promise<Coupon> {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.couponRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        errorCode: 'COUPON_ALREADY_EXISTS',
        message: `Mã giảm giá "${code}" đã tồn tại`,
      });
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (startDate >= endDate) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'INVALID_COUPON_DATES',
        message: 'Ngày bắt đầu phải trước ngày kết thúc',
      });
    }

    if (
      dto.discountType === 'percentage' &&
      (dto.discountValue <= 0 || dto.discountValue > 100)
    ) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'INVALID_DISCOUNT_VALUE',
        message: 'Phần trăm giảm giá phải lớn hơn 0 và nhỏ hơn hoặc bằng 100',
      });
    }

    const coupon = this.couponRepository.create({
      ...dto,
      code,
      minOrderValue: dto.minOrderValue ?? 0,
      userUsageLimit: dto.userUsageLimit ?? 1,
      usedCount: 0,
      isActive: dto.isActive ?? true,
      startDate,
      endDate,
    });

    return await this.couponRepository.save(coupon);
  }

  async getAllCoupons(query?: any): Promise<Coupon[]> {
    return await this.couponRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async toggleCoupon(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'COUPON_NOT_FOUND',
        message: 'Không tìm thấy mã giảm giá',
      });
    }

    coupon.isActive = !coupon.isActive;
    return await this.couponRepository.save(coupon);
  }
}
