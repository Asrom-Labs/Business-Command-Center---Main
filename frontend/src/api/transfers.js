import api from '@/lib/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

export function fetchTransfers(params = {}) {
  return api.get('/transfers', { params: cleanParams(params) });
}

export function fetchTransfer(id) {
  return api.get(`/transfers/${id}`);
}

export function createTransfer(data) {
  return api.post('/transfers', data);
}

export function confirmTransfer(id) {
  return api.post(`/transfers/${id}/confirm`);
}

export function cancelTransfer(id) {
  return api.post(`/transfers/${id}/cancel`);
}
