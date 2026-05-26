import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';

@Entity('product_images')
@Index(['isPrimary'])
export class ProductImage extends BaseEntity {
  @Column()
  imageUrl: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
