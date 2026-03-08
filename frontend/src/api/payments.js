import api from '@/lib/api';

export const paymentsApi = {
  listForOrder: (orderId)      => api.get(`/payments/order/${orderId}`),
  record:       (orderId, data) => api.post(`/payments/order/${orderId}`, data),
};
