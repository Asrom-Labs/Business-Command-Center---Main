import api from '@/lib/api';

export const unitsApi = {
  list:   (params)   => api.get('/units', { params }),
  getOne: (id)       => api.get(`/units/${id}`),
  create: (data)     => api.post('/units', data),
  update: (id, data) => api.patch(`/units/${id}`, data),
  delete: (id)       => api.delete(`/units/${id}`),
};
