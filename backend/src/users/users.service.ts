import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import {
  GetAdminUsersDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, userData);
    return this.findById(id);
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { passwordResetToken: token },
    });
  }

  /**
   * Đổi mật khẩu user
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'USER_NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException({
        statusCode: 400,
        errorCode: 'USER_INVALID_PASSWORD',
        message: 'Mật khẩu cũ không chính xác',
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await this.usersRepository.update(userId, { password: hashedPassword });
  }

  // =============================================
  // ADMIN METHODS
  // =============================================

  /**
   * API 34/37: GET /admin/users [MVP]
   * Lấy danh sách users (admin)
   */
  async getAllUsers(query: GetAdminUsersDto): Promise<any> {
    const { page = 1, limit = 10, search, role } = query;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.phone',
        'user.role',
        'user.status',
        'user.createdAt',
      ])
      .orderBy('user.createdAt', 'DESC');

    // Filter by role
    if (role) {
      qb.andWhere('user.role = :role', { role });
    }

    // Search by email or name
    if (search) {
      qb.andWhere('(user.email LIKE :search OR user.fullName LIKE :search)', {
        search: `%${search}%`,
      });
    }

    const total = await qb.getCount();
    const users = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Lấy orderCount + totalSpent cho từng user
    const userIds = users.map((u) => u.id);
    const orderStats: Record<
      string,
      { orderCount: number; totalSpent: number }
    > = {};

    if (userIds.length > 0) {
      const stats = await this.orderRepository
        .createQueryBuilder('order')
        .select('order.userId', 'userId')
        .addSelect('COUNT(*)', 'orderCount')
        .addSelect(
          "COALESCE(SUM(CASE WHEN order.orderStatus = 'completed' THEN order.totalAmount ELSE 0 END), 0)",
          'totalSpent',
        )
        .where('order.userId IN (:...userIds)', { userIds })
        .groupBy('order.userId')
        .getRawMany();

      stats.forEach((s) => {
        orderStats[s.userId] = {
          orderCount: parseInt(s.orderCount),
          totalSpent: Number(s.totalSpent),
        };
      });
    }

    return {
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        orderCount: orderStats[user.id]?.orderCount || 0,
        totalSpent: orderStats[user.id]?.totalSpent || 0,
        createdAt: user.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * API 35/37: GET /admin/users/:id [MVP]
   * Lấy chi tiết user (admin)
   */
  async getAdminUserById(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'fullName',
        'phone',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'USER_NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }

    // Order history summary
    const orderSummary = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'totalOrders')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'totalSpent')
      .addSelect(
        "COALESCE(SUM(CASE WHEN order.orderStatus = 'completed' THEN order.totalAmount ELSE 0 END), 0)",
        'completedRevenue',
      )
      .where('order.userId = :userId', { userId })
      .getRawOne();

    const ordersByStatus = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.userId = :userId', { userId })
      .groupBy('order.orderStatus')
      .getRawMany();

    const statusMap: Record<string, number> = {};
    ordersByStatus.forEach((row) => {
      statusMap[row.status] = parseInt(row.count);
    });

    // Recent orders (last 5)
    const recentOrders = await this.orderRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 5,
      select: [
        'id',
        'orderCode',
        'totalAmount',
        'orderStatus',
        'paymentStatus',
        'createdAt',
      ],
    });

    return {
      ...user,
      orderHistory: {
        totalOrders: parseInt(orderSummary?.totalOrders) || 0,
        totalSpent: Number(orderSummary?.totalSpent) || 0,
        completedRevenue: Number(orderSummary?.completedRevenue) || 0,
        ordersByStatus: statusMap,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        totalAmount: Number(o.totalAmount),
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      })),
    };
  }

  /**
   * API 36/37: PUT /admin/users/:id/status [MVP]
   * Cập nhật status user (active/inactive)
   */
  async updateUserStatus(
    userId: string,
    adminId: string,
    dto: UpdateUserStatusDto,
  ): Promise<any> {
    // Prevent locking self
    if (userId === adminId) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'CANNOT_MODIFY_SELF',
        message: 'Không thể thay đổi trạng thái tài khoản của chính mình',
      });
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'USER_NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }

    user.status = dto.status;
    await this.usersRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * API 37/37: PUT /admin/users/:id/role [MVP]
   * Cập nhật role user (customer/admin)
   */
  async updateUserRole(
    userId: string,
    adminId: string,
    dto: UpdateUserRoleDto,
  ): Promise<any> {
    // Prevent changing own role
    if (userId === adminId) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'CANNOT_MODIFY_SELF',
        message: 'Không thể thay đổi role của chính mình',
      });
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'USER_NOT_FOUND',
        message: 'Không tìm thấy người dùng',
      });
    }

    user.role = dto.role;
    await this.usersRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
