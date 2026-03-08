import api from '@/lib/api';

export const purchaseOrdersApi = {
  list:         (params)          => api.get('/purchase-orders', { params }),
  getOne:       (id)              => api.get(`/purchase-orders/${id}`),
  create:       (data)            => api.post('/purchase-orders', data),
  updateStatus: (id, status)      => api.patch(`/purchase-orders/${id}/status`, { status }),
  receive:      (id, data)        => api.post(`/purchase-orders/${id}/receive`, data),
};
