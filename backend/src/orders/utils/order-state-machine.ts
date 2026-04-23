/**
 * State Machine Validator cho Order Status
 * Định nghĩa các transition hợp lệ giữa các trạng thái
 */
export const ALLOWED_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Kiểm tra xem transition từ status hiện tại sang status mới có hợp lệ không
 */
export function isValidTransition(
  currentStatus: string,
  newStatus: string,
): boolean {
  const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedStatuses) return false;
  return allowedStatuses.includes(newStatus);
}

/**
 * Lấy danh sách các status có thể chuyển từ status hiện tại
 */
export function getNextAllowedStatuses(currentStatus: string): string[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}
