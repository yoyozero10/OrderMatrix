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

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

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
