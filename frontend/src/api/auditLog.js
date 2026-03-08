import api from '@/lib/api';

export const auditLogApi = {
  list: (params) => api.get('/audit-log', { params }),
};
