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
  price: number;
  stock: number;
  status: "active" | "inactive";
  category: {
    id: string;
    name: string;
  } | null;
  primaryImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
  category: {
    id: string;
    name: string;
    description?: string;
  } | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  subtotal: number;
  product: {
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
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
}
