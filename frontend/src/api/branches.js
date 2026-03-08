import api from '@/lib/api';

export const branchesApi = {
  list:       (params)     => api.get('/branches', { params }),
  getOne:     (id)         => api.get(`/branches/${id}`),
  create:     (data)       => api.post('/branches', data),
  update:     (id, data)   => api.patch(`/branches/${id}`, data),
  deactivate: (id)         => api.delete(`/branches/${id}`),
};
