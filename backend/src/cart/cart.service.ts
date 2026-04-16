import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart, CartItem } from './entities';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource, // Inject DataSource for transactions
  ) {}

  /**
   * API 13/37: GET /cart [MVP]
   * Lấy giỏ hàng của user, tạo mới nếu chưa có
   */
  async getCart(userId: string): Promise<any> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.product',
        'items.product.images',
        'items.product.category',
      ],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: { id: userId } as User,
        items: [],
      });
      cart = await this.cartRepository.save(cart);
    }

    return this.formatCartResponse(cart);
  }

  /**
   * API 14/37: POST /cart/items [MVP]
   * Thêm sản phẩm vào giỏ hàng
   * Sử dụng transaction + pessimistic locking để tránh race condition
   */
  async addToCart(userId: string, dto: AddToCartDto): Promise<any> {
    await this.dataSource.transaction(async (manager) => {
      // 1. Lock product row để tránh race condition
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException({
          statusCode: 404,
          errorCode: 'PRODUCT_NOT_FOUND',
          message: 'Không tìm thấy sản phẩm',
        });
      }

      // 2. Check stock availability
      if (product.stock < dto.quantity) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'CART_OUT_OF_STOCK',
          message: `Sản phẩm chỉ còn ${product.stock} trong kho`,
        });
      }

      // 3. Get or create cart
      let cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.product'],
      });

      if (!cart) {
        cart = manager.create(Cart, {
          user: { id: userId } as User,
          items: [],
        });
        cart = await manager.save(cart);
      }

      // 4. Check if item already exists in cart
      let cartItem = await manager.findOne(CartItem, {
        where: {
          cart: { id: cart.id },
          product: { id: dto.productId },
        },
      });

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + dto.quantity;
        if (newQuantity > product.stock) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'CART_OUT_OF_STOCK',
            message: `Không thể thêm. Tổng số lượng vượt quá tồn kho (${product.stock})`,
          });
        }
        cartItem.quantity = newQuantity;
        await manager.save(cartItem);
      } else {
        // Create new cart item
        cartItem = manager.create(CartItem, {
          cart: { id: cart.id } as Cart,
          product: { id: dto.productId } as Product,
          quantity: dto.quantity,
        });
        await manager.save(cartItem);
      }
    });

    // Return updated cart after transaction completes
    return this.getCart(userId);
  }

  /**
   * API 15/37: PUT /cart/items/:id [MVP]
   * Cập nhật số lượng cart item (cũng dùng transaction + locking)
   */
  async updateCartItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<any> {
    await this.dataSource.transaction(async (manager) => {
      // 1. Find cart item with relations và lock
      const cartItem = await manager.findOne(CartItem, {
        where: { id: itemId },
        relations: ['cart', 'cart.user', 'product'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!cartItem) {
        throw new NotFoundException({
          statusCode: 404,
          errorCode: 'CART_ITEM_NOT_FOUND',
          message: 'Không tìm thấy sản phẩm trong giỏ hàng',
        });
      }

      // 2. Validate cart belongs to user
      if (cartItem.cart.user.id !== userId) {
        throw new ForbiddenException({
          statusCode: 403,
          errorCode: 'CART_FORBIDDEN',
          message: 'Bạn không có quyền cập nhật giỏ hàng này',
        });
      }

      // 3. Lock product để check stock
      const product = await manager.findOne(Product, {
        where: { id: cartItem.product.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product || dto.quantity > product.stock) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'CART_OUT_OF_STOCK',
          message: `Sản phẩm chỉ còn ${product?.stock || 0} trong kho`,
        });
      }

      // 4. Update quantity
      cartItem.quantity = dto.quantity;
      await manager.save(cartItem);
    });

    // Return updated cart
    return this.getCart(userId);
  }

  /**
   * API 16/37: DELETE /cart/items/:id [MVP]
   * Xóa một sản phẩm khỏi giỏ hàng
   */
  async removeCartItem(userId: string, itemId: string): Promise<any> {
    // 1. Find cart item with relations
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: ['cart', 'cart.user'],
    });

    if (!cartItem) {
      throw new NotFoundException({
        statusCode: 404,
        errorCode: 'CART_ITEM_NOT_FOUND',
        message: 'Không tìm thấy sản phẩm trong giỏ hàng',
      });
    }

    // 2. Validate cart belongs to user
    if (cartItem.cart.user.id !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'CART_FORBIDDEN',
        message: 'Bạn không có quyền xóa sản phẩm này',
      });
    }

    // 3. Delete cart item
    await this.cartItemRepository.remove(cartItem);

    // 4. Return updated cart
    return this.getCart(userId);
  }

  /**
   * API 17/37: DELETE /cart [MVP]
   * Xóa tất cả sản phẩm trong giỏ hàng
   */
  async clearCart(userId: string): Promise<{ message: string }> {
    // 1. Find cart with items
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items'],
    });

    if (!cart) {
      return { message: 'Giỏ hàng trống' };
    }

    // 2. Delete all cart items
    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    return { message: 'Đã xóa toàn bộ giỏ hàng' };
  }

  /**
   * Helper: Format cart response
   */
  private formatCartResponse(cart: Cart): any {
    const items =
      cart.items?.map((item) => {
        const product = item.product;
        const primaryImage =
          product.images?.find((img) => img.isPrimary)?.imageUrl ||
          product.images?.[0]?.imageUrl ||
          null;
        const subtotal = Number(product.price) * item.quantity;

        return {
          id: item.id,
          quantity: item.quantity,
          product: {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            stock: product.stock,
            status: product.status,
            primaryImage,
            category: product.category
              ? {
                  id: product.category.id,
                  name: product.category.name,
                }
              : null,
          },
          subtotal,
        };
      }) || [];

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: cart.id,
      items,
      totalItems,
      totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Helper: Tìm cart theo userId
   */
  async findCartByUserId(userId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });
  }

  /**
   * Helper: Tìm hoặc tạo cart
   */
  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.findCartByUserId(userId);

    if (!cart) {
      cart = this.cartRepository.create({
        user: { id: userId } as User,
        items: [],
      });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }
}
