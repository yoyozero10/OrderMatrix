import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../../products/entities/product.entity';

// Forward reference để tránh circular dependency
import type { Cart } from './cart.entity';

@Entity('cart_items')
export class CartItem extends BaseEntity {
  @ManyToOne('Cart', 'items', { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => Product)
  product: Product;

  @Column()
  quantity: number;
}
