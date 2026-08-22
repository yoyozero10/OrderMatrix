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
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private dataSource: DataSource,
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
        'items.variant',
        'items.variant.product',
        'items.variant.product.images',
        'items.variant.optionValues',
        'items.variant.optionValues.optionValue',
        'items.variant.optionValues.optionValue.optionType',
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
   * Thêm variant vào giỏ hàng
   * Sử dụng transaction + pessimistic locking để tránh race condition
   */
  async addToCart(userId: string, dto: AddToCartDto): Promise<any> {
    await this.dataSource.transaction(async (manager) => {
      // 1. Lock variant row để tránh race condition
      const variant = await manager.findOne(ProductVariant, {
        where: { id: dto.variantId },
        relations: ['product'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!variant) {
        throw new NotFoundException({
          statusCode: 404,
          errorCode: 'VARIANT_NOT_FOUND',
          message: 'Không tìm thấy sản phẩm (variant)',
        });
      }

      if (variant.status !== 'active') {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'VARIANT_INACTIVE',
          message: 'Sản phẩm này hiện không còn bán',
        });
      }

      // 2. Check stock availability
      if (variant.stock < dto.quantity) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'CART_OUT_OF_STOCK',
          message: `Sản phẩm chỉ còn ${variant.stock} trong kho`,
        });
      }

      // 3. Get or create cart
      let cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.variant'],
      });

      if (!cart) {
        cart = manager.create(Cart, {
          user: { id: userId } as User,
          items: [],
        });
        cart = await manager.save(cart);
      }

      // 4. Check if this variant already exists in cart
      let cartItem = await manager.findOne(CartItem, {
        where: {
          cart: { id: cart.id },
          variant: { id: dto.variantId },
        },
      });

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + dto.quantity;
        if (newQuantity > variant.stock) {
          throw new BadRequestException({
            statusCode: 400,
            errorCode: 'CART_OUT_OF_STOCK',
            message: `Không thể thêm. Tổng số lượng vượt quá tồn kho (${variant.stock})`,
          });
        }
        cartItem.quantity = newQuantity;
        await manager.save(cartItem);
      } else {
        // Create new cart item
        cartItem = manager.create(CartItem, {
          cart: { id: cart.id } as Cart,
          variant: { id: dto.variantId } as ProductVariant,
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
   * Cập nhật số lượng cart item
   */
  async updateCartItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<any> {
    await this.dataSource.transaction(async (manager) => {
      // 1. Find cart item với relations
      const cartItem = await manager.findOne(CartItem, {
        where: { id: itemId },
        relations: ['cart', 'cart.user', 'variant'],
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

      // 3. Lock variant để check stock
      if (!cartItem.variant) {
        throw new NotFoundException({
          statusCode: 404,
          errorCode: 'VARIANT_NOT_FOUND',
          message: 'Sản phẩm trong giỏ hàng không còn tồn tại',
        });
      }

      const variant = await manager.findOne(ProductVariant, {
        where: { id: cartItem.variant.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!variant || dto.quantity > variant.stock) {
        throw new BadRequestException({
          statusCode: 400,
          errorCode: 'CART_OUT_OF_STOCK',
          message: `Sản phẩm chỉ còn ${variant?.stock || 0} trong kho`,
        });
      }

      // 4. Update quantity
      cartItem.quantity = dto.quantity;
      await manager.save(cartItem);
    });

    return this.getCart(userId);
  }

  /**
   * API 16/37: DELETE /cart/items/:id [MVP]
   * Xóa một item khỏi giỏ hàng
   */
  async removeCartItem(userId: string, itemId: string): Promise<any> {
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

    if (cartItem.cart.user.id !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'CART_FORBIDDEN',
        message: 'Bạn không có quyền xóa sản phẩm này',
      });
    }

    await this.cartItemRepository.remove(cartItem);
    return this.getCart(userId);
  }

  /**
   * API 17/37: DELETE /cart [MVP]
   * Xóa tất cả sản phẩm trong giỏ hàng
   */
  async clearCart(userId: string): Promise<{ message: string }> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items'],
    });

    if (!cart) {
      return { message: 'Giỏ hàng trống' };
    }

    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    return { message: 'Đã xóa toàn bộ giỏ hàng' };
  }

  /**
   * Helper: Format cart response bao gồm variant info
   */
  private formatCartResponse(cart: Cart): any {
    const items =
      cart.items
        ?.map((item) => {
          const variant = item.variant;
          if (!variant) return null;

          const product = variant.product;
          const primaryImage =
            product?.images?.find((img) => img.isPrimary)?.imageUrl ||
            product?.images?.[0]?.imageUrl ||
            null;

          const price = Number(variant.price);
          const subtotal = price * item.quantity;

          // Format option values display (e.g. "Xanh Titan | 256GB")
          const optionValues = (variant.optionValues ?? [])
            .sort(
              (a, b) =>
                (a.optionValue?.optionType?.displayOrder ?? 0) -
                (b.optionValue?.optionType?.displayOrder ?? 0),
            )
            .map((vov) => ({
              optionType: vov.optionValue?.optionType?.name ?? '',
              value: vov.optionValue?.value ?? '',
            }));

          return {
            id: item.id,
            quantity: item.quantity,
            variant: {
              id: variant.id,
              sku: variant.sku,
              price,
              stock: variant.stock,
              status: variant.status,
              optionValues,
              product: product
                ? {
                    id: product.id,
                    name: product.name,
                    basePrice: Number(product.basePrice),
                    primaryImage,
                  }
                : null,
            },
            subtotal,
          };
        })
        .filter(Boolean) || [];

    const totalItems = items.reduce(
      (sum, item) => sum + (item?.quantity || 0),
      0,
    );
    const totalAmount = items.reduce(
      (sum, item) => sum + (item?.subtotal || 0),
      0,
    );

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
   * Helper: Tìm cart theo userId (dùng bởi OrdersService)
   */
  async findCartByUserId(userId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
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
