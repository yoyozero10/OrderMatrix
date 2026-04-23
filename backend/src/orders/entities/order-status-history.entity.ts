import { Entity, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory extends BaseEntity {
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  fromStatus: string;

  @Column()
  toStatus: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  changedBy?: string;
}
