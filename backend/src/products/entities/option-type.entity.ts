import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { OptionValue } from './option-value.entity';

@Entity('option_types')
export class OptionType extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: 0 })
  displayOrder: number;

  @OneToMany(() => OptionValue, (value) => value.optionType, { cascade: true })
  values: OptionValue[];
}
