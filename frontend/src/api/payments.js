import api from '@/lib/api';

/**
 * GET /api/payments/order/:orderId
 * Lists all payments for a single sales order.
 * ⚠️ RULE-25: Returns a PLAIN ARRAY — no pagination object.
 * Use: select: (result) => result.data ?? []
 */
export function fetchPaymentsForOrder(orderId) {
  return api.get(`/payments/order/${orderId}`);
}

/**
 * GET /api/payments/:id — single payment record.
 */
export function fetchPayment(id) {
  return api.get(`/payments/${id}`);
}

/**
 * POST /api/payments/order/:orderId — record a payment.
 * ⚠️ RULE-26: OVERPAYMENT error requires specific handling.
 */
export function recordPayment(orderId, data) {
  return api.post(`/payments/order/${orderId}`, data);
}
