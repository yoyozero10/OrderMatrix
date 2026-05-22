import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
@Index(['status'])
@Index(['role'])
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: ['customer', 'admin'], default: 'customer' })
  role: string;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: string;

  // Refresh Token (hashed)
  @Column({ nullable: true })
  refreshToken: string;

  // Password Reset
  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ type: 'datetime', nullable: true })
  passwordResetExpires: Date;
}
