import api from '@/lib/api';

export function fetchSuppliers(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
  return api.get('/suppliers', { params: cleanParams });
}

export function fetchSupplier(id) {
  return api.get(`/suppliers/${id}`);
}

export function createSupplier(data) {
  return api.post('/suppliers', data);
}

export function updateSupplier(id, data) {
  return api.put(`/suppliers/${id}`, data);
}

export function deleteSupplier(id) {
  return api.delete(`/suppliers/${id}`);
}
