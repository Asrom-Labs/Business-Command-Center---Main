import api from '@/lib/api';

export function fetchPurchaseOrders(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
  return api.get('/purchase-orders', { params: cleanParams });
}

export function fetchPurchaseOrder(id) {
  return api.get(`/purchase-orders/${id}`);
}

export function createPurchaseOrder(data) {
  return api.post('/purchase-orders', data);
}

export function updatePurchaseOrderStatus(id, status) {
  return api.patch(`/purchase-orders/${id}/status`, { status });
}

export function receivePurchaseOrder(id, data) {
  return api.post(`/purchase-orders/${id}/receive`, data);
}
