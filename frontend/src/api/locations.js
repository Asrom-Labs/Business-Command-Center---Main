import api from '@/lib/api';

export const locationsApi = {
  list:       (params)   => api.get('/locations', { params }),
  getOne:     (id)       => api.get(`/locations/${id}`),
  create:     (data)     => api.post('/locations', data),
  update:     (id, data) => api.patch(`/locations/${id}`, data),
  deactivate: (id)       => api.delete(`/locations/${id}`),
};
