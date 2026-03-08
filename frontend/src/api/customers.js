import api from '@/lib/api';

export const customersApi = {
  list:       (params)   => api.get('/customers', { params }),
  getOne:     (id)       => api.get(`/customers/${id}`),
  create:     (data)     => api.post('/customers', data),
  update:     (id, data) => api.patch(`/customers/${id}`, data),
  deactivate: (id)       => api.delete(`/customers/${id}`),
  addNote:    (id, note) => api.post(`/customers/${id}/notes`, { note }),
  getNotes:   (id)       => api.get(`/customers/${id}/notes`),
};
