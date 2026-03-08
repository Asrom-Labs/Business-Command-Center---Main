import api from '@/lib/api';

export const suppliersApi = {
  list:       (params)   => api.get('/suppliers', { params }),
  getOne:     (id)       => api.get(`/suppliers/${id}`),
  create:     (data)     => api.post('/suppliers', data),
  update:     (id, data) => api.patch(`/suppliers/${id}`, data),
  deactivate: (id)       => api.delete(`/suppliers/${id}`),
};
