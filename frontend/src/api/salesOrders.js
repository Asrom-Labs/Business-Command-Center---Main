import api from '@/lib/api';

export function fetchSalesOrders(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
  return api.get('/sales-orders', { params: cleanParams });
}

export function fetchSalesOrder(id) {
  return api.get(`/sales-orders/${id}`);
}

export function createSalesOrder(data) {
  return api.post('/sales-orders', data);
}

export function updateSalesOrderStatus(id, status) {
  return api.patch(`/sales-orders/${id}/status`, { status });
}
