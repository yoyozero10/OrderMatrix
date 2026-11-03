import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductImage } from '../../products/entities/product-image.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { OptionType } from '../../products/entities/option-type.entity';
import { OptionValue } from '../../products/entities/option-value.entity';
import { VariantOptionValue } from '../../products/entities/variant-option-value.entity';
import { User } from '../../users/entities/user.entity';
import { Coupon, CouponUsage } from '../../coupons/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Product,
      ProductImage,
      ProductVariant,
      OptionType,
      OptionValue,
      VariantOptionValue,
      User,
      Coupon,
      CouponUsage,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
