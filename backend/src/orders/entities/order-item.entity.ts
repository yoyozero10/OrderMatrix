import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order } from './order.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => ProductVariant, { nullable: true })
  variant: ProductVariant;

  @Column()
  productNameSnapshot: string;

  @Column({ nullable: true })
  skuSnapshot: string;

  @Column('json', { nullable: true })
  variantSnapshot: object;
  // e.g. { "Màu sắc": "Xanh Titan", "Dung lượng": "256GB" }

  @Column('decimal', { precision: 10, scale: 2 })
  unitPriceSnapshot: number;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;
}
