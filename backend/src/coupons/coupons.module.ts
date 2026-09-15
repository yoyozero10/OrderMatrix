import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { AdminCouponsController } from './admin-coupons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, CouponUsage])],
  controllers: [CouponsController, AdminCouponsController],
  providers: [CouponsService],
  exports: [CouponsService, TypeOrmModule],
})
export class CouponsModule {}
