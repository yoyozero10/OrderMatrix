import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';
import { VariantOptionValue } from './variant-option-value.entity';

@Entity('product_variants')
@Index(['sku'], { unique: true })
@Index(['price'])
@Index(['status'])
export class ProductVariant extends BaseEntity {
  @Column({ unique: true })
  sku: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @OneToMany(() => VariantOptionValue, (vov) => vov.variant, { cascade: true })
  optionValues: VariantOptionValue[];
}
