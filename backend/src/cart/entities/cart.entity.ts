import { Entity, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

// Import type để tránh circular dependency khi compile
import type { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany('CartItem', 'cart', { cascade: true })
  items: CartItem[];
}
