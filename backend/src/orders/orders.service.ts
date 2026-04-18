import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderItem, OrderStatusHistory } from './entities';
import { Cart } from '../cart/entities';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateOrderDto,
  GetOrdersDto,
  GetAdminOrdersDto,
  UpdateOrderStatusDto,
} from './dto';
import { WinstonLoggerService } from '../common/logger';

@Injectable()
export class OrdersService {
  // Allowed state transitions
  private static readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipping', 'cancelled'],
    shipping: ['completed'],
    completed: [],
    cancelled: [],
  };

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private orderStatusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private logger: WinstonLoggerService,
  ) {}

  private readonly context = 'OrdersService';

  /**
   * Generate unique order code: ORD-YYYYMMDD-XXXX
   */
  private async generateOrderCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Đếm số đơn hàng trong ngày để tạo sequence
    const count = await this.orderRepository
      .createQueryBuilder('order')
      .where('DATE(order.createdAt) = CURDATE()')
      .getCount();

    const sequence = String(count + 1).padStart(4, '0');
    return `ORD-${dateStr}-${sequence}`;
  }

  /**
   * API 18/37: POST /orders [MVP] ⭐
   * Tạo đơn hàng từ giỏ hàng
   *
   * Flow:
   * 1. Validate cart not empty
   * 2. Start Transaction
   * 3. For each cart item: Check stock with FOR UPDATE lock
   * 4. Generate order code
   * 5. Create order + order items (with snapshots)
   * 6. Update stock (atomic)
   * 7. Create status history
   * 8. Clear cart
   * 9. Commit Transaction
   */
  async createOrder(userId: string, dto: CreateOrderDto): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Lấy cart với items
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.product'],
      });

      // Validate cart not empty
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'ORDER_CART_EMPTY',
          message: 'Giỏ hàng trống, không thể đặt hàng',
        });
      }

      // 2. Validate stock với FOR UPDATE lock + tính tổng tiền
      let totalAmount = 0;
      const orderItemsData: {
        product: Product;
        productNameSnapshot: string;
        unitPriceSnapshot: number;
        quantity: number;
        subtotal: number;
      }[] = [];

      for (const cartItem of cart.items) {
        // Check stock with FOR UPDATE lock (pessimistic_write)
        const product = await manager.findOne(Product, {
          where: { id: cartItem.product.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'ORDER_PRODUCT_NOT_FOUND',
            message: `Sản phẩm "${cartItem.product.name}" không còn tồn tại`,
          });
        }

        // If stock < quantity → Rollback
        if (product.stock < cartItem.quantity) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'CART_OUT_OF_STOCK',
            message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho (yêu cầu ${cartItem.quantity})`,
          });
        }

        // Tính snapshot values
        const unitPriceSnapshot = Number(product.price);
        const subtotal = unitPriceSnapshot * cartItem.quantity;
        totalAmount += subtotal;

        orderItemsData.push({
          product,
          productNameSnapshot: product.name,
          unitPriceSnapshot,
          quantity: cartItem.quantity,
          subtotal,
        });

        // Update stock (atomic): stock = stock - quantity
        await manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `stock - ${cartItem.quantity}` })
          .where('id = :id', { id: product.id })
          .execute();
      }

      // 3. Generate order code
      const orderCode = await this.generateOrderCode();

      // 4. Create order
      const order = manager.create(Order, {
        orderCode,
        user: { id: userId },
        totalAmount,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod || 'COD',
        paymentStatus: 'pending',
        orderStatus: 'pending',
      });

      const savedOrder = await manager.save(order);

      // 5. Create order items with snapshots
      for (const itemData of orderItemsData) {
        const orderItem = manager.create(OrderItem, {
          order: { id: savedOrder.id } as Order,
          product: { id: itemData.product.id } as Product,
          productNameSnapshot: itemData.productNameSnapshot,
          unitPriceSnapshot: itemData.unitPriceSnapshot,
          quantity: itemData.quantity,
          subtotal: itemData.subtotal,
        });
        await manager.save(orderItem);
      }

      // 6. Create status history [Optional]
      const statusHistory = manager.create(OrderStatusHistory, {
        order: { id: savedOrder.id } as Order,
        fromStatus: 'pending',
        toStatus: 'pending',
        note: 'Đơn hàng được tạo',
        changedBy: userId,
      });
      await manager.save(statusHistory);

      // 7. Clear cart - xóa tất cả cart items
      await manager.remove(cart.items);

      // 8. Return created order (fetch full data)
      const createdOrder = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items', 'items.product'],
      });

      this.logger.log(
        `Đơn hàng được tạo: ${createdOrder!.orderCode} - userId=${userId} - ${orderItemsData.length} sản phẩm - Tổng: ${totalAmount.toLocaleString()}đ`,
        this.context,
      );

      return this.formatOrderResponse(createdOrder!);
    });
  }

  /**
   * API 19/37: GET /orders [MVP]
   * Lấy danh sách đơn hàng của user hiện tại
   * - Filter by user (current user only)
   * - Pagination
   * - Filter by status (optional)
   * - Order by createdAt DESC
   * - Return summary (no items)
   */
  async getMyOrders(userId: string, query: GetOrdersDto): Promise<any> {
    const { page = 1, limit = 10, orderStatus } = query;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    // Filter by status (optional)
    if (orderStatus) {
      qb.andWhere('order.orderStatus = :orderStatus', { orderStatus });
    }

    // Pagination
    const total = await qb.getCount();
    const orders = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: orders.map((order) => ({
        id: order.id,
        orderCode: order.orderCode,
        totalAmount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
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
   * API 20/37: GET /orders/:id [MVP]
   * Lấy chi tiết đơn hàng
   * - Validate order belongs to user
   * - Return full order with items
   * - Include status history [Optional]
   */
  async getOrderById(userId: string, orderId: string): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'ORDER_NOT_FOUND',
        message: 'Không tìm thấy đơn hàng',
      });
    }

    // Validate order belongs to user
    if (order.user.id !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'FORBIDDEN_RESOURCE',
        message: 'Bạn không có quyền xem đơn hàng này',
      });
    }

    // Include status history [Optional]
    const statusHistory = await this.orderStatusHistoryRepository.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'ASC' },
    });

    const response = this.formatOrderResponse(order);
    response.statusHistory = statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      note: h.note,
      changedBy: h.changedBy,
      createdAt: h.createdAt,
    }));

    return response;
  }

  /**
   * API 21/37: PUT /orders/:id/cancel [Optional]
   * Hủy đơn hàng
   * - Validate order belongs to user
   * - Check status = 'pending'
   * - Transaction: update status + restore stock + status history
   */
  async cancelOrder(userId: string, orderId: string): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      // Lấy order với items
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.product', 'user'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException({
          statusCode: 404,
          errorCode: 'ORDER_NOT_FOUND',
          message: 'Không tìm thấy đơn hàng',
        });
      }

      // Validate order belongs to user
      if (order.user.id !== userId) {
        throw new ForbiddenException({
          statusCode: 403,
          errorCode: 'FORBIDDEN_RESOURCE',
          message: 'Bạn không có quyền hủy đơn hàng này',
        });
      }

      // Check status = 'pending' only
      if (order.orderStatus !== 'pending') {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'ORDER_INVALID_TRANSITION',
          message: `Không thể hủy đơn hàng ở trạng thái "${order.orderStatus}". Chỉ được hủy khi đang "pending"`,
        });
      }

      // Update status to 'cancelled'
      const oldStatus = order.orderStatus;
      order.orderStatus = 'cancelled';
      await manager.save(order);

      // Restore stock (atomic update)
      for (const item of order.items) {
        await manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `stock + ${item.quantity}` })
          .where('id = :id', { id: item.product.id })
          .execute();
      }

      // Create status history
      const statusHistory = manager.create(OrderStatusHistory, {
        order: { id: orderId } as Order,
        fromStatus: oldStatus,
        toStatus: 'cancelled',
        note: 'Người dùng hủy đơn hàng',
        changedBy: userId,
      });
      await manager.save(statusHistory);

      // Return updated order
      const updatedOrder = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.product'],
      });

      return this.formatOrderResponse(updatedOrder!);
    });
  }

  // =============================================
  // ADMIN METHODS
  // =============================================

  /**
   * API 30/37: GET /admin/orders [MVP]
   * Lấy tất cả đơn hàng (admin)
   * - Không filter theo user
   * - Pagination, filter by status, search
   */
  async getAllOrders(query: GetAdminOrdersDto): Promise<any> {
    const { page = 1, limit = 10, orderStatus, search } = query;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .addSelect(['user.id', 'user.fullName', 'user.email'])
      .orderBy('order.createdAt', 'DESC');

    // Filter by status
    if (orderStatus) {
      qb.andWhere('order.orderStatus = :orderStatus', { orderStatus });
    }

    // Search by order code or customer name
    if (search) {
      qb.andWhere(
        '(order.orderCode LIKE :search OR user.fullName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await qb.getCount();
    const orders = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: orders.map((order) => ({
        id: order.id,
        orderCode: order.orderCode,
        totalAmount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        customer: order.user
          ? {
              id: order.user.id,
              fullName: order.user.fullName,
              email: order.user.email,
            }
          : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
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
   * API 31/37: GET /admin/orders/:id [MVP]
   * Lấy chi tiết đơn hàng (admin) - không cần validate ownership
   * - Include customer info
   * - Include status history
   */
  async getAdminOrderById(orderId: string): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'ORDER_NOT_FOUND',
        message: 'Không tìm thấy đơn hàng',
      });
    }

    // Include status history
    const statusHistory = await this.orderStatusHistoryRepository.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'ASC' },
    });

    const response = this.formatOrderResponse(order);

    // Add customer info
    response.customer = order.user
      ? {
          id: order.user.id,
          fullName: order.user.fullName,
          email: order.user.email,
          phone: order.user.phone,
        }
      : null;

    response.statusHistory = statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      note: h.note,
      changedBy: h.changedBy,
      createdAt: h.createdAt,
    }));

    return response;
  }

  /**
   * Format order response
   */
  private formatOrderResponse(order: Order): any {
    return {
      id: order.id,
      orderCode: order.orderCode,
      totalAmount: Number(order.totalAmount),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      items:
        order.items?.map((item) => ({
          id: item.id,
          productNameSnapshot: item.productNameSnapshot,
          unitPriceSnapshot: Number(item.unitPriceSnapshot),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name,
              }
            : null,
        })) || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * API 32/37: PUT /admin/orders/:id/status [MVP]
   * Cập nhật trạng thái đơn hàng (admin)
   */
  async updateOrderStatus(
    orderId: string,
    adminId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.product', 'user'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException({
          statusCode: 404,
          errorCode: 'ORDER_NOT_FOUND',
          message: 'Không tìm thấy đơn hàng',
        });
      }

      // Validate state transition
      const allowedNextStatuses =
        OrdersService.ALLOWED_TRANSITIONS[order.orderStatus] || [];
      if (!allowedNextStatuses.includes(dto.status)) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'ORDER_INVALID_TRANSITION',
          message: `Không thể chuyển trạng thái từ "${order.orderStatus}" sang "${dto.status}". Cho phép: ${allowedNextStatuses.join(', ') || 'không có'}`,
        });
      }

      const oldStatus = order.orderStatus;
      order.orderStatus = dto.status;

      // Nếu chuyển sang completed → update paymentStatus
      if (dto.status === 'completed' && order.paymentMethod === 'COD') {
        order.paymentStatus = 'paid';
      }

      // Nếu cancelled → restore stock
      if (dto.status === 'cancelled') {
        for (const item of order.items) {
          await manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock: () => `stock + ${item.quantity}` })
            .where('id = :id', { id: item.product.id })
            .execute();
        }
      }

      await manager.save(order);

      // Create status history
      const history = manager.create(OrderStatusHistory, {
        order: { id: orderId } as Order,
        fromStatus: oldStatus,
        toStatus: dto.status,
        note:
          dto.note ||
          `Admin chuyển trạng thái từ ${oldStatus} sang ${dto.status}`,
        changedBy: adminId,
      });
      await manager.save(history);

      // Return updated order
      const updatedOrder = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.product'],
      });
      this.logger.log(
        `Chuyển trạng thái đơn hàng: ${order.orderCode} (${oldStatus} → ${dto.status}) - adminId=${adminId}${dto.status === 'cancelled' ? ' [CANCELLED - stock restored]' : ''}`,
        this.context,
      );

      return this.formatOrderResponse(updatedOrder!);
    });
  }

  /**
   * API 33/37: GET /admin/orders/stats [MVP]
   * Thống kê đơn hàng
   */
  async getOrderStats(): Promise<any> {
    // Total orders
    const totalOrders = await this.orderRepository.count();

    // Total revenue (completed orders only)
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'totalRevenue')
      .where('order.orderStatus = :status', { status: 'completed' })
      .getRawOne();

    // Orders by status
    const statusCounts = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.orderStatus')
      .getRawMany();

    const ordersByStatus: Record<string, number> = {};
    statusCounts.forEach((row) => {
      ordersByStatus[row.status] = parseInt(row.count);
    });

    // Revenue by month (last 6 months)
    const revenueByMonth = await this.orderRepository
      .createQueryBuilder('order')
      .select("DATE_FORMAT(order.createdAt, '%Y-%m')", 'month')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('order.orderStatus = :status', { status: 'completed' })
      .andWhere('order.createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      totalOrders,
      totalRevenue: Number(revenueResult?.totalRevenue) || 0,
      ordersByStatus,
      revenueByMonth: revenueByMonth.map((row) => ({
        month: row.month,
        revenue: Number(row.revenue) || 0,
        orders: parseInt(row.orders) || 0,
      })),
    };
  }
}
