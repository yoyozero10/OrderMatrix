import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart, CartItem } from './entities';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product])],
  controllers: [CartController],
  providers: [CartService],
  exports: [TypeOrmModule, CartService],
})
export class CartModule {}
