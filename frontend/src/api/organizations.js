import api from '@/lib/api';

export const organizationsApi = {
  getMyOrg:    ()     => api.get('/organizations/me'),
  updateMyOrg: (data) => api.patch('/organizations/me', data),
};
