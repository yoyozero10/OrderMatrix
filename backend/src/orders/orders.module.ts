import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem, OrderStatusHistory } from './entities';
import { Cart } from '../cart/entities';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderStatusHistory,
      Cart,
      CartItem,
      Product,
      User,
    ]),
  ],
  providers: [OrdersService],
  controllers: [OrdersController, AdminOrdersController],
  exports: [TypeOrmModule],
})
export class OrdersModule {}
