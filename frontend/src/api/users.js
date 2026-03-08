import api from '@/lib/api';

export const usersApi = {
  list:       (params)   => api.get('/users', { params }),
  getOne:     (id)       => api.get(`/users/${id}`),
  create:     (data)     => api.post('/users', data),
  update:     (id, data) => api.patch(`/users/${id}`, data),
  deactivate: (id)       => api.delete(`/users/${id}`),
};
