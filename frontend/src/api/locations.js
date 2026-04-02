import api from '@/lib/api';

export function fetchLocations(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
  return api.get('/locations', { params: cleanParams });
}
