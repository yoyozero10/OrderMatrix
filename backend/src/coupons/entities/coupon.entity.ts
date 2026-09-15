import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('coupons')
@Index(['isActive'])
export class Coupon extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: ['percentage', 'fixed'] })
  discountType: 'percentage' | 'fixed';

  @Column('decimal', { precision: 14, scale: 2 })
  discountValue: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  maxDiscountAmount: number | null;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  minOrderValue: number;

  @Column({ type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'int', default: 1 })
  userUsageLimit: number;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  transformCode() {
    if (this.code) {
      this.code = this.code.trim().toUpperCase();
    }
  }
}
