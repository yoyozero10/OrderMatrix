import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index(['orderStatus'])
@Index(['createdAt'])
export class Order extends BaseEntity {
  @Column({ unique: true })
  orderCode: string;

  @ManyToOne(() => User)
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column('decimal', { precision: 14, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCodeSnapshot?: string | null;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  discountAmount: number;

  @Column('json')
  shippingAddress: object;

  @Column({ type: 'enum', enum: ['COD', 'MOCK'] })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  })
  paymentStatus: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled'],
    default: 'pending',
  })
  orderStatus: string;
}
