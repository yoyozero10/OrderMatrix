export type UserRole = "customer" | "admin";
export type UserStatus = "active" | "inactive";

export type PaymentMethod = "COD" | "MOCK";
export type PaymentStatus = "pending" | "paid" | "failed";
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  productCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  description: string;
  price?: number;
  basePrice?: number;
  stock?: number;
  status: "active" | "inactive";
  category: {
    id: string;
    name: string;
  } | null;
  primaryImage: string | null;
  colors?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductOptionValue {
  id: string;
  value: string;
  colorCode?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
}

export interface ProductOption {
  id: string;
  name: string;
  displayOrder?: number;
  values: ProductOptionValue[];
}

export interface ProductVariantItem {
  id: string;
  sku: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
  imageUrl?: string | null;
  optionValues?: { optionType: string; value: string }[];
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price?: number;
  basePrice?: number;
  stock?: number;
  status: "active" | "inactive";
  category: {
    id: string;
    name: string;
    description?: string;
  } | null;
  images: ProductImage[];
  variants?: ProductVariantItem[];
  options?: ProductOption[];
  optionTypes?: ProductOption[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  subtotal: number;
  variant?: {
    id: string;
    sku: string;
    price: number;
    stock: number;
    status: string;
    product?: {
      id: string;
      name: string;
      primaryImage?: string | null;
    };
  };
  product?: {
    id: string;
    name: string;
    price: number;
    stock: number;
    status: "active" | "inactive";
    primaryImage: string | null;
    category: {
      id: string;
      name: string;
    } | null;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  ward?: string;
  district?: string;
  city: string;
}

export interface OrderItem {
  id: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
  } | null;
}

export interface OrderStatusHistory {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note?: string;
  changedBy: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: string;
  orderCode: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderSummary extends OrderSummary {
  customer: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface AdminUserDetail extends User {
  orderHistory: {
    totalOrders: number;
    totalSpent: number;
    completedRevenue: number;
    ordersByStatus: Partial<Record<OrderStatus, number>>;
  };
  recentOrders: Array<{
    id: string;
    orderCode: string;
    totalAmount: number;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }>;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "name_asc";
}

export interface AddProductImageRequest {
  imageUrl: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface AddToCartRequest {
  variantId?: string;
  productId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export type DiscountType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  usedCount: number;
  userUsageLimit?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplyCouponRequest {
  code: string;
  orderTotal: number;
}

export interface ApplyCouponResponse {
  valid: boolean;
  coupon: Coupon;
  discountAmount: number;
  finalTotal: number;
}

// ----------------------------------------------------
// Compatibility & Apple Setup Canvas
// ----------------------------------------------------

export interface ValidateSetupRequest {
  variantIds: string[];
}

export interface CompatibilityPowerItem {
  id: string;
  name: string;
  type: "consumer" | "provider";
  powerWatts: number;
  minWatts?: number;
  maxWatts?: number;
}

export interface CompatibilityWarning {
  level: "warning" | "error" | "info";
  title: string;
  message: string;
}

export interface CompatibilityReport {
  isCompatible: boolean;
  power: {
    totalRequiredWatts: number;
    totalSuppliedWatts: number;
    balanceWatts: number;
    status: "sufficient" | "deficit" | "none";
    details: CompatibilityPowerItem[];
  };
  colorHarmony: {
    score: number; // 0 - 100
    theme: string;
    dominantColors: string[];
    isHarmonious: boolean;
  };
  connectivity: {
    portsMatched: boolean;
    missingCables: string[];
    notes: string[];
  };
  warnings: CompatibilityWarning[];
  bundle: {
    totalPrice: number;
    eligibleForBundle: boolean;
    suggestedCoupon?: string;
    discountPercent?: number;
    discountAmount?: number;
    finalPrice?: number;
    message?: string;
  };
}
