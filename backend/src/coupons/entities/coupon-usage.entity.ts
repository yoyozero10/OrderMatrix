import { Entity, ManyToOne, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Coupon } from './coupon.entity';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('coupon_usages')
export class CouponUsage extends BaseEntity {
  @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
  coupon: Coupon;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  order: Order | null;

  @CreateDateColumn()
  usedAt: Date;
}
