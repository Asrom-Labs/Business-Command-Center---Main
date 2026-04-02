import api from '@/lib/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
}

/**
 * GET /api/returns/reasons — plain array of return reasons.
 * ⚠️ RULE-27: Each item shape is { id, reason, created_at }.
 * The text field is "reason" — NOT "name" or "label".
 */
export function fetchReturnReasons() {
  return api.get('/returns/reasons');
}

/** GET /api/returns — paginated list of all returns. */
export function fetchReturns(params = {}) {
  return api.get('/returns', { params: cleanParams(params) });
}

/** GET /api/returns/:id — single return with items array. */
export function fetchReturn(id) {
  return api.get(`/returns/${id}`);
}

/**
 * POST /api/returns — create a return. Stock auto-restored.
 * Message: "Return processed and stock restored"
 */
export function createReturn(data) {
  return api.post('/returns', data);
}
