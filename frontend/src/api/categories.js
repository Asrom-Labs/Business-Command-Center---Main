import api from '@/lib/api';

export const categoriesApi = {
  list:   (params)   => api.get('/categories', { params }),
  getOne: (id)       => api.get(`/categories/${id}`),
  create: (data)     => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id)       => api.delete(`/categories/${id}`),
};
