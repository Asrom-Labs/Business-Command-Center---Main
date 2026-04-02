import api from '@/lib/api';

export function fetchCustomers(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
  return api.get('/customers', { params: cleanParams });
}

export function fetchCustomer(id) {
  return api.get(`/customers/${id}`);
}

export function createCustomer(data) {
  return api.post('/customers', data);
}

export function updateCustomer(id, data) {
  return api.put(`/customers/${id}`, data);
}

export function deleteCustomer(id) {
  return api.delete(`/customers/${id}`);
}
