import type { OrderStatus } from "@/lib/api/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipping: "Shipping",
  completed: "Completed",
  cancelled: "Cancelled"
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed"
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-sky-100 text-sky-800 border-sky-200",
  shipping: "bg-teal-100 text-teal-800 border-teal-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200"
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: "COD", label: "Cash on Delivery" },
  { value: "MOCK", label: "Mock Payment" }
] as const;

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "processing",
  "shipping",
  "completed",
  "cancelled"
];
