import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

// Forward reference để tránh circular dependency
import type { Cart } from './cart.entity';

@Entity('cart_items')
export class CartItem extends BaseEntity {
  @ManyToOne('Cart', 'items', { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => ProductVariant)
  variant: ProductVariant;

  @Column()
  quantity: number;
}
