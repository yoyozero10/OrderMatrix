import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { OptionType } from './option-type.entity';

@Entity('option_values')
@Index(['optionType', 'value'])
export class OptionValue extends BaseEntity {
  @Column()
  value: string;

  @Column({ nullable: true })
  colorCode: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  displayOrder: number;

  @ManyToOne(() => OptionType, (optionType) => optionType.values, {
    onDelete: 'CASCADE',
  })
  optionType: OptionType;
}
