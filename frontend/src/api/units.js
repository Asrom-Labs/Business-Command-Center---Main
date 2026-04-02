import api from '@/lib/api';

/**
 * Fetch paginated list of units.
 * @param {{ page?: number, limit?: number }} params
 */
export function fetchUnits(params = {}) {
  return api.get('/units', { params });
}

/**
 * Fetch a single unit by ID.
 * @param {string} id
 */
export function fetchUnit(id) {
  return api.get(`/units/${id}`);
}

/**
 * Create a new unit.
 * @param {{ name: string, abbreviation: string }} data
 */
export function createUnit(data) {
  return api.post('/units', data);
}

/**
 * Update an existing unit.
 * @param {string} id
 * @param {{ name?: string, abbreviation?: string }} data
 */
export function updateUnit(id, data) {
  return api.put(`/units/${id}`, data);
}

/**
 * Delete a unit by ID.
 * @param {string} id
 */
export function deleteUnit(id) {
  return api.delete(`/units/${id}`);
}
