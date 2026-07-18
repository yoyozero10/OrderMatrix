import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Category } from '../../categories/entities/category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
@Index(['status'])
@Index(['name'])
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  basePrice: number;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants: ProductVariant[];
}
