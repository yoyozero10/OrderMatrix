import { apiRequest } from "@/lib/api/client";
import type {
  AddToCartRequest,
  AddProductImageRequest,
  AdminOrderSummary,
  AdminUserDetail,
  AdminUserSummary,
  Cart,
  Category,
  CreateOrderRequest,
  LoginRequest,
  LoginResponse,
  Order,
  OrderStats,
  OrderSummary,
  PaginatedResponse,
  ProductDetail,
  ProductFilters,
  ProductListItem,
  RegisterRequest,
  RegisterResponse,
  User,
  UserRole,
  UserStatus
} from "@/lib/api/types";

export const authApi = {
  register(body: RegisterRequest) {
    return apiRequest<RegisterResponse>("/auth/register", { method: "POST", body });
  },
  login(body: LoginRequest) {
    return apiRequest<LoginResponse>("/auth/login", { method: "POST", body });
  },
  refresh(refreshToken: string) {
    return apiRequest<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      body: { refreshToken }
    });
  },
  logout(token: string) {
    return apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
      token
    });
  }
};

export const userApi = {
  getMe(token: string) {
    return apiRequest<User>("/users/me", { token });
  },
  updateMe(token: string, body: Partial<Pick<User, "fullName" | "phone" | "avatar">>) {
    return apiRequest<User>("/users/me", { method: "PUT", token, body });
  },
  changePassword(
    token: string,
    body: { oldPassword: string; newPassword: string; confirmPassword: string }
  ) {
    return apiRequest<{ message: string }>("/users/me/password", {
      method: "PUT",
      token,
      body
    });
  }
};

export const productApi = {
  getProducts(filters: ProductFilters = {}) {
    return apiRequest<PaginatedResponse<ProductListItem>>("/products", {
      query: filters
    });
  },
  getProductById(id: string) {
    return apiRequest<ProductDetail>(`/products/${id}`);
  }
};

export const categoryApi = {
  getCategories() {
    return apiRequest<Category[]>("/categories");
  }
};

export const cartApi = {
  getCart(token: string) {
    return apiRequest<Cart>("/cart", { token });
  },
  addItem(token: string, body: AddToCartRequest) {
    return apiRequest<Cart>("/cart/items", { method: "POST", token, body });
  },
  updateItem(token: string, itemId: string, quantity: number) {
    return apiRequest<Cart>(`/cart/items/${itemId}`, {
      method: "PUT",
      token,
      body: { quantity }
    });
  },
  removeItem(token: string, itemId: string) {
    return apiRequest<Cart>(`/cart/items/${itemId}`, {
      method: "DELETE",
      token
    });
  },
  clear(token: string) {
    return apiRequest<{ message: string }>("/cart", {
      method: "DELETE",
      token
    });
  }
};

export const orderApi = {
  create(token: string, body: CreateOrderRequest) {
    return apiRequest<Order>("/orders", { method: "POST", token, body });
  },
  getMine(token: string, query?: { page?: number; limit?: number; orderStatus?: string }) {
    return apiRequest<PaginatedResponse<OrderSummary>>("/orders", {
      token,
      query
    });
  },
  getById(token: string, id: string) {
    return apiRequest<Order>(`/orders/${id}`, { token });
  },
  cancel(token: string, id: string) {
    return apiRequest<Order>(`/orders/${id}/cancel`, {
      method: "PUT",
      token
    });
  }
};

export const adminApi = {
  getOrderStats(token: string) {
    return apiRequest<OrderStats>("/admin/orders/stats", { token });
  },
  getOrders(
    token: string,
    query?: { page?: number; limit?: number; orderStatus?: string; search?: string }
  ) {
    return apiRequest<PaginatedResponse<AdminOrderSummary>>("/admin/orders", {
      token,
      query
    });
  },
  getOrderById(token: string, id: string) {
    return apiRequest<Order>(`/admin/orders/${id}`, { token });
  },
  updateOrderStatus(
    token: string,
    id: string,
    status: string,
    note?: string
  ) {
    return apiRequest<Order>(`/admin/orders/${id}/status`, {
      method: "PUT",
      token,
      body: { status, note }
    });
  },
  createProduct(
    token: string,
    body: {
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: string;
      status: "active" | "inactive";
    }
  ) {
    return apiRequest<ProductDetail>("/admin/products", { method: "POST", token, body });
  },
  updateProduct(
    token: string,
    id: string,
    body: Partial<{
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: string;
      status: "active" | "inactive";
    }>
  ) {
    return apiRequest<ProductDetail>(`/admin/products/${id}`, {
      method: "PUT",
      token,
      body
    });
  },
  deleteProduct(token: string, id: string) {
    return apiRequest<{ message: string }>(`/admin/products/${id}`, {
      method: "DELETE",
      token
    });
  },
  addProductImage(token: string, productId: string, body: AddProductImageRequest) {
    return apiRequest<ProductDetail>(`/admin/products/${productId}/images`, {
      method: "POST",
      token,
      body
    });
  },
  deleteProductImage(token: string, productId: string, imageId: string) {
    return apiRequest<ProductDetail>(`/admin/products/${productId}/images/${imageId}`, {
      method: "DELETE",
      token
    });
  },
  createCategory(
    token: string,
    body: { name: string; description?: string; image?: string }
  ) {
    return apiRequest<Category>("/admin/categories", { method: "POST", token, body });
  },
  updateCategory(
    token: string,
    id: string,
    body: { name?: string; description?: string; image?: string }
  ) {
    return apiRequest<Category>(`/admin/categories/${id}`, {
      method: "PUT",
      token,
      body
    });
  },
  deleteCategory(token: string, id: string) {
    return apiRequest<{ message: string }>(`/admin/categories/${id}`, {
      method: "DELETE",
      token
    });
  },
  getUsers(
    token: string,
    query?: { page?: number; limit?: number; search?: string; role?: UserRole }
  ) {
    return apiRequest<PaginatedResponse<AdminUserSummary>>("/admin/users", {
      token,
      query
    });
  },
  getUserById(token: string, id: string) {
    return apiRequest<AdminUserDetail>(`/admin/users/${id}`, { token });
  },
  updateUserStatus(token: string, id: string, status: UserStatus) {
    return apiRequest<User>(`/admin/users/${id}/status`, {
      method: "PUT",
      token,
      body: { status }
    });
  },
  updateUserRole(token: string, id: string, role: UserRole) {
    return apiRequest<User>(`/admin/users/${id}/role`, {
      method: "PUT",
      token,
      body: { role }
    });
  }
};
