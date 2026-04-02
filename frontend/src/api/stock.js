import api from '@/lib/api';

/**
 * Fetch paginated stock levels across all locations.
 *
 * Pass { low_stock: true } to return only items at or below threshold.
 * Strips undefined / null / empty-string params before sending.
 *
 * @param {{ page?: number, limit?: number, location_id?: string, product_id?: string, low_stock?: boolean }} params
 */
export function fetchStock(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
  return api.get('/stock', { params: cleanParams });
}
