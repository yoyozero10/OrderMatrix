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
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { Coupon, CouponUsage } from '../coupons/entities';
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
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
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
      // 1. Lấy cart với items.variant (không còn items.product)
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: [
          'items',
          'items.variant',
          'items.variant.product',
          'items.variant.optionValues',
          'items.variant.optionValues.optionValue',
          'items.variant.optionValues.optionValue.optionType',
        ],
      });

      // Validate cart not empty
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'ORDER_CART_EMPTY',
          message: 'Giỏ hàng trống, không thể đặt hàng',
        });
      }

      // 2. Validate stock variant với FOR UPDATE lock + tính tổng tiền
      let totalAmount = 0;
      const orderItemsData: {
        variant: ProductVariant;
        productNameSnapshot: string;
        skuSnapshot: string;
        variantSnapshot: Record<string, string>;
        unitPriceSnapshot: number;
        quantity: number;
        subtotal: number;
      }[] = [];

      for (const cartItem of cart.items) {
        if (!cartItem.variant) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'ORDER_VARIANT_NOT_FOUND',
            message: 'Một sản phẩm trong giỏ hàng không còn tồn tại',
          });
        }

        // Lock variant row với FOR UPDATE
        const variant = await manager.findOne(ProductVariant, {
          where: { id: cartItem.variant.id },
          relations: [
            'product',
            'optionValues',
            'optionValues.optionValue',
            'optionValues.optionValue.optionType',
          ],
          lock: { mode: 'pessimistic_write' },
        });

        if (!variant || !variant.product) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'ORDER_VARIANT_NOT_FOUND',
            message: `Sản phẩm (variant: ${cartItem.variant.id}) không còn tồn tại`,
          });
        }

        if (variant.status !== 'active') {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'ORDER_VARIANT_INACTIVE',
            message: `Sản phẩm "${variant.product.name}" hiện không còn bán`,
          });
        }

        // Check stock
        if (variant.stock < cartItem.quantity) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'CART_OUT_OF_STOCK',
            message: `Sản phẩm "${variant.product.name}" (${variant.sku}) chỉ còn ${variant.stock} trong kho (yêu cầu ${cartItem.quantity})`,
          });
        }

        // Build variantSnapshot: { "Màu sắc": "Xanh Titan", "Dung lượng": "256GB" }
        const variantSnapshot: Record<string, string> = {};
        for (const vov of variant.optionValues ?? []) {
          if (vov.optionValue?.optionType?.name) {
            variantSnapshot[vov.optionValue.optionType.name] =
              vov.optionValue.value;
          }
        }

        const unitPriceSnapshot = Number(variant.price);
        const subtotal = unitPriceSnapshot * cartItem.quantity;
        totalAmount += subtotal;

        orderItemsData.push({
          variant,
          productNameSnapshot: variant.product.name,
          skuSnapshot: variant.sku,
          variantSnapshot,
          unitPriceSnapshot,
          quantity: cartItem.quantity,
          subtotal,
        });

        // Deduct stock from variant (atomic)
        await manager
          .createQueryBuilder()
          .update(ProductVariant)
          .set({ stock: () => `stock - ${cartItem.quantity}` })
          .where('id = :id', { id: variant.id })
          .execute();
      }

      // 2.1 Xử lý coupon nếu có
      let discountAmount = 0;
      let appliedCoupon: Coupon | null = null;

      if (dto.couponCode) {
        const code = dto.couponCode.trim().toUpperCase();
        appliedCoupon = await manager.findOne(Coupon, {
          where: { code },
          lock: { mode: 'pessimistic_write' },
        });

        if (!appliedCoupon) {
          throw new NotFoundException({
            statusCode: 404,
            errorCode: 'COUPON_NOT_FOUND',
            message: 'Mã giảm giá không tồn tại',
          });
        }

        if (!appliedCoupon.isActive) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'COUPON_INACTIVE',
            message: 'Mã giảm giá hiện không hoạt động',
          });
        }

        const now = new Date();
        if (now < new Date(appliedCoupon.startDate)) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'COUPON_NOT_STARTED',
            message: 'Mã giảm giá chưa đến thời gian áp dụng',
          });
        }

        if (now > new Date(appliedCoupon.endDate)) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'COUPON_EXPIRED',
            message: 'Mã giảm giá đã hết hạn',
          });
        }

        if (
          appliedCoupon.usageLimit !== null &&
          appliedCoupon.usageLimit !== undefined &&
          appliedCoupon.usedCount >= appliedCoupon.usageLimit
        ) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'COUPON_USAGE_LIMIT_EXCEEDED',
            message: 'Mã giảm giá đã hết lượt sử dụng',
          });
        }

        const minOrderValue = Number(appliedCoupon.minOrderValue || 0);
        if (totalAmount < minOrderValue) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'COUPON_MIN_ORDER_VALUE',
            message: `Đơn hàng tối thiểu phải từ ${minOrderValue.toLocaleString()}đ để áp dụng mã giảm giá`,
          });
        }

        const userUsageLimit = appliedCoupon.userUsageLimit ?? 1;
        const userUsageCount = await manager.count(CouponUsage, {
          where: {
            coupon: { id: appliedCoupon.id },
            user: { id: userId },
          },
        });

        if (userUsageCount >= userUsageLimit) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'COUPON_USER_LIMIT_EXCEEDED',
            message: 'Bạn đã hết lượt sử dụng mã giảm giá này',
          });
        }

        if (appliedCoupon.discountType === 'percentage') {
          discountAmount =
            (totalAmount * Number(appliedCoupon.discountValue)) / 100;
          if (
            appliedCoupon.maxDiscountAmount !== null &&
            appliedCoupon.maxDiscountAmount !== undefined
          ) {
            discountAmount = Math.min(
              discountAmount,
              Number(appliedCoupon.maxDiscountAmount),
            );
          }
        } else {
          discountAmount = Number(appliedCoupon.discountValue);
        }

        discountAmount = Math.min(discountAmount, totalAmount);
        discountAmount = Math.max(0, Math.round(discountAmount * 100) / 100);
      }

      const finalAmount = Math.max(0, totalAmount - discountAmount);

      // 3. Generate order code
      const orderCode = await this.generateOrderCode();

      // 4. Create order
      const order = manager.create(Order, {
        orderCode,
        user: { id: userId },
        totalAmount: finalAmount,
        discountAmount,
        couponCodeSnapshot: appliedCoupon ? appliedCoupon.code : null,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod || 'COD',
        paymentStatus: 'pending',
        orderStatus: 'pending',
      });

      const savedOrder = await manager.save(order);

      // Cập nhật usedCount của coupon và ghi nhận CouponUsage
      if (appliedCoupon) {
        appliedCoupon.usedCount += 1;
        await manager.save(appliedCoupon);

        const couponUsage = manager.create(CouponUsage, {
          coupon: appliedCoupon,
          user: { id: userId } as User,
          order: savedOrder,
          usedAt: new Date(),
        });
        await manager.save(couponUsage);
      }

      // 5. Create order items with snapshots (variant-aware)
      for (const itemData of orderItemsData) {
        const orderItem = manager.create(OrderItem, {
          order: { id: savedOrder.id } as Order,
          variant: { id: itemData.variant.id } as ProductVariant,
          productNameSnapshot: itemData.productNameSnapshot,
          skuSnapshot: itemData.skuSnapshot,
          variantSnapshot: itemData.variantSnapshot,
          unitPriceSnapshot: itemData.unitPriceSnapshot,
          quantity: itemData.quantity,
          subtotal: itemData.subtotal,
        });
        await manager.save(orderItem);
      }

      // 6. Create status history
      const statusHistory = manager.create(OrderStatusHistory, {
        order: { id: savedOrder.id } as Order,
        fromStatus: 'pending',
        toStatus: 'pending',
        note: 'Đơn hàng được tạo',
        changedBy: userId,
      });
      await manager.save(statusHistory);

      // 7. Clear cart
      await manager.remove(cart.items);

      // 8. Return created order
      const createdOrder = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items', 'items.variant', 'items.variant.product'],
      });

      this.logger.log(
        `Đơn hàng được tạo: ${createdOrder!.orderCode} - userId=${userId} - ${orderItemsData.length} variants - Tổng: ${totalAmount.toLocaleString()}đ`,
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
        discountAmount: Number(order.discountAmount ?? 0),
        couponCodeSnapshot: order.couponCodeSnapshot ?? null,
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
      relations: ['items', 'items.variant', 'items.variant.product', 'user'],
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
      // Lấy order với items.variant
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items', 'items.variant', 'user'],
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

      // Restore stock vào variant (atomic update)
      for (const item of order.items) {
        if (item.variant?.id) {
          await manager
            .createQueryBuilder()
            .update(ProductVariant)
            .set({ stock: () => `stock + ${item.quantity}` })
            .where('id = :id', { id: item.variant.id })
            .execute();
        }
      }

      // Hoàn trả lượt dùng coupon (giảm usedCount, xóa CouponUsage)
      if (order.couponCodeSnapshot) {
        const couponUsage = await manager.findOne(CouponUsage, {
          where: { order: { id: orderId } },
          relations: ['coupon'],
        });

        if (couponUsage) {
          const couponToRefund = couponUsage.coupon
            ? await manager.findOne(Coupon, {
                where: { id: couponUsage.coupon.id },
                lock: { mode: 'pessimistic_write' },
              })
            : await manager.findOne(Coupon, {
                where: { code: order.couponCodeSnapshot },
                lock: { mode: 'pessimistic_write' },
              });

          if (couponToRefund && couponToRefund.usedCount > 0) {
            couponToRefund.usedCount -= 1;
            await manager.save(couponToRefund);
          }

          await manager.remove(couponUsage);
        }
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
        relations: ['items', 'items.variant', 'items.variant.product'],
      });

      return this.formatOrderResponse(updatedOrder!);
    });
  }

  /**
   * API: POST /orders/:id/pay
   * Mô phỏng thanh toán trực tuyến
   */
  async payOrder(userId: string, orderId: string): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['user', 'items', 'items.variant', 'items.variant.product'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException({
          statusCode: 404,
          errorCode: 'ORDER_NOT_FOUND',
          message: 'Không tìm thấy đơn hàng',
        });
      }

      if (order.user.id !== userId) {
        throw new ForbiddenException({
          statusCode: 403,
          errorCode: 'FORBIDDEN_RESOURCE',
          message: 'Bạn không có quyền thanh toán đơn hàng này',
        });
      }

      if (order.orderStatus === 'cancelled') {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'ORDER_ALREADY_CANCELLED',
          message: 'Đơn hàng đã hủy, không thể thanh toán',
        });
      }

      if (order.paymentStatus === 'paid') {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'ORDER_ALREADY_PAID',
          message: 'Đơn hàng đã được thanh toán trước đó',
        });
      }

      order.paymentStatus = 'paid';
      if (order.orderStatus === 'pending') {
        order.orderStatus = 'processing';
      }

      await manager.save(order);

      const statusHistory = manager.create(OrderStatusHistory, {
        order: { id: orderId } as Order,
        fromStatus: 'pending',
        toStatus: order.orderStatus,
        note: 'Thanh toán trực tuyến thành công',
        changedBy: userId,
      });
      await manager.save(statusHistory);

      return this.formatOrderResponse(order);
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
        discountAmount: Number(order.discountAmount ?? 0),
        couponCodeSnapshot: order.couponCodeSnapshot ?? null,
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
      relations: ['items', 'items.variant', 'items.variant.product', 'user'],
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
      discountAmount: Number(order.discountAmount ?? 0),
      couponCodeSnapshot: order.couponCodeSnapshot ?? null,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      items:
        order.items?.map((item) => ({
          id: item.id,
          productNameSnapshot: item.productNameSnapshot,
          skuSnapshot: item.skuSnapshot ?? null,
          variantSnapshot: item.variantSnapshot ?? null,
          unitPriceSnapshot: Number(item.unitPriceSnapshot),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
          variant: item.variant
            ? {
                id: item.variant.id,
                sku: item.variant.sku,
                product: item.variant.product
                  ? {
                      id: item.variant.product.id,
                      name: item.variant.product.name,
                    }
                  : null,
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
        relations: ['items', 'items.variant', 'user'],
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

      // Nếu cancelled → restore stock vào variant và hoàn trả coupon
      if (dto.status === 'cancelled') {
        for (const item of order.items) {
          if (item.variant?.id) {
            await manager
              .createQueryBuilder()
              .update(ProductVariant)
              .set({ stock: () => `stock + ${item.quantity}` })
              .where('id = :id', { id: item.variant.id })
              .execute();
          }
        }

        if (order.couponCodeSnapshot) {
          const couponUsage = await manager.findOne(CouponUsage, {
            where: { order: { id: orderId } },
            relations: ['coupon'],
          });

          if (couponUsage) {
            const couponToRefund = couponUsage.coupon
              ? await manager.findOne(Coupon, {
                  where: { id: couponUsage.coupon.id },
                  lock: { mode: 'pessimistic_write' },
                })
              : await manager.findOne(Coupon, {
                  where: { code: order.couponCodeSnapshot },
                  lock: { mode: 'pessimistic_write' },
                });

            if (couponToRefund && couponToRefund.usedCount > 0) {
              couponToRefund.usedCount -= 1;
              await manager.save(couponToRefund);
            }

            await manager.remove(couponUsage);
          }
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
        relations: ['items', 'items.variant', 'items.variant.product'],
      });
      this.logger.log(
        `Chuyển trạng thái đơn hàng: ${order.orderCode} (${oldStatus} → ${dto.status}) - adminId=${adminId}${dto.status === 'cancelled' ? ' [CANCELLED - variant stock restored]' : ''}`,
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
