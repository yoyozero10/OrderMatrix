import { Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProductVariant } from './product-variant.entity';
import { OptionValue } from './option-value.entity';

@Entity('variant_option_values')
export class VariantOptionValue extends BaseEntity {
  @ManyToOne(() => ProductVariant, (variant) => variant.optionValues, {
    onDelete: 'CASCADE',
  })
  variant: ProductVariant;

  @ManyToOne(() => OptionValue, { eager: true, onDelete: 'CASCADE' })
  optionValue: OptionValue;
}
