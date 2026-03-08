import api from '@/lib/api';

export const salesOrdersApi = {
  list:         (params)     => api.get('/sales-orders', { params }),
  getOne:       (id)         => api.get(`/sales-orders/${id}`),
  create:       (data)       => api.post('/sales-orders', data),
  updateStatus: (id, status) => api.patch(`/sales-orders/${id}/status`, { status }),
};
