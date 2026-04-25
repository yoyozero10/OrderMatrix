import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// =============================================
// AUTH EXCEPTIONS
// =============================================

export class AuthEmailExistsException extends ConflictException {
  constructor() {
    super({
      statusCode: 409,
      errorCode: 'AUTH_EMAIL_EXISTS',
      message: 'Email đã được đăng ký',
    });
  }
}

export class AuthInvalidCredentialsException extends BadRequestException {
  constructor() {
    super({
      statusCode: 400,
      errorCode: 'AUTH_INVALID_CREDENTIALS',
      message: 'Email hoặc mật khẩu không chính xác',
    });
  }
}

export class AuthInvalidRefreshTokenException extends BadRequestException {
  constructor() {
    super({
      statusCode: 400,
      errorCode: 'AUTH_INVALID_REFRESH_TOKEN',
      message: 'Refresh token không hợp lệ hoặc đã hết hạn',
    });
  }
}

// =============================================
// PRODUCT EXCEPTIONS
// =============================================

export class ProductNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: 404,
      errorCode: 'PRODUCT_NOT_FOUND',
      message: 'Không tìm thấy sản phẩm',
    });
  }
}

export class CategoryNotFoundException extends BadRequestException {
  constructor() {
    super({
      statusCode: 400,
      errorCode: 'CATEGORY_NOT_FOUND',
      message: 'Danh mục không tồn tại',
    });
  }
}

export class CategoryHasProductsException extends BadRequestException {
  constructor(name: string) {
    super({
      statusCode: 400,
      errorCode: 'CATEGORY_HAS_PRODUCTS',
      message: `Không thể xóa danh mục "${name}" vì đang có sản phẩm`,
    });
  }
}

// =============================================
// CART EXCEPTIONS
// =============================================

export class CartOutOfStockException extends BadRequestException {
  constructor(productName: string, stock: number, requested: number) {
    super({
      statusCode: 400,
      errorCode: 'CART_OUT_OF_STOCK',
      message: `Sản phẩm "${productName}" chỉ còn ${stock} trong kho (yêu cầu ${requested})`,
    });
  }
}

export class CartItemNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: 404,
      errorCode: 'CART_ITEM_NOT_FOUND',
      message: 'Không tìm thấy sản phẩm trong giỏ hàng',
    });
  }
}

// =============================================
// ORDER EXCEPTIONS
// =============================================

export class OrderNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: 404,
      errorCode: 'ORDER_NOT_FOUND',
      message: 'Không tìm thấy đơn hàng',
    });
  }
}

export class OrderCartEmptyException extends BadRequestException {
  constructor() {
    super({
      statusCode: 400,
      errorCode: 'ORDER_CART_EMPTY',
      message: 'Giỏ hàng trống, không thể đặt hàng',
    });
  }
}

export class OrderInvalidTransitionException extends BadRequestException {
  constructor(from: string, to: string, allowed: string[]) {
    super({
      statusCode: 400,
      errorCode: 'ORDER_INVALID_TRANSITION',
      message: `Không thể chuyển trạng thái từ "${from}" sang "${to}". Cho phép: ${allowed.join(', ') || 'không có'}`,
    });
  }
}

// =============================================
// USER EXCEPTIONS
// =============================================

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({
      statusCode: 404,
      errorCode: 'USER_NOT_FOUND',
      message: 'Không tìm thấy người dùng',
    });
  }
}

export class CannotModifySelfException extends ForbiddenException {
  constructor(action: string = 'thay đổi') {
    super({
      statusCode: 403,
      errorCode: 'CANNOT_MODIFY_SELF',
      message: `Không thể ${action} của chính mình`,
    });
  }
}

export class ForbiddenResourceException extends ForbiddenException {
  constructor(message: string = 'Bạn không có quyền truy cập tài nguyên này') {
    super({
      statusCode: 403,
      errorCode: 'FORBIDDEN_RESOURCE',
      message,
    });
  }
}
