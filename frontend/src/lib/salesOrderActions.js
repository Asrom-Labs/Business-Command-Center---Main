/**
 * Sales-order action matrix — the UI's single mirror of the backend guards.
 *
 * The UI must never offer an action the backend rejects, and never hide one it
 * allows. When the backend rules change, change THIS file in the same commit.
 *
 * Mirrors backend/src/controllers/sales-orders.controller.js (D5, W5.5-P2):
 *
 *   updateStatus validTransitions:
 *     pending        → [processing, cancelled]
 *     partially_paid → [processing, cancelled]
 *     paid           → [processing, shipped]
 *     processing     → [shipped, cancelled]
 *     shipped        → [delivered]
 *     delivered      → []
 *     cancelled      → []
 *   ('paid' and 'partially_paid' are set exclusively by the payments system.)
 *
 *   payments.controller.create: blocks payment when status === 'cancelled', and the
 *   OVERPAYMENT guard prevents paying more than NET payable (total − refunded_total).
 *
 *   updateStatus (W5.5-P2.1, INV-4): a forward fulfilment transition
 *   (processing/shipped/delivered) is refused when the order is FULLY returned.
 *   A partial return does NOT block advancement.
 *
 * The refund-aware figures (remaining, net_payable, fully_returned, has_returnable)
 * are computed by the backend (order-finance.service.js) and read off the order
 * payload here — the frontend never computes payable or return status itself.
 */

// Fulfillment transitions the backend permits from each status (cancel handled separately).
const VALID_TRANSITIONS = {
  pending:        ['processing', 'cancelled'],
  partially_paid: ['processing', 'cancelled'],
  paid:           ['processing', 'shipped'],
  processing:     ['shipped', 'cancelled'],
  shipped:        ['delivered'],
  delivered:      [],
  cancelled:      [],
};

export function getAllowedSalesOrderActions(order) {
  const status = order?.status;
  // NET remaining from the backend payload; fall back to net_payable/total only if absent.
  const remaining = order?.remaining != null
    ? parseFloat(order.remaining)
    : Math.max(0, parseFloat(order?.net_payable ?? order?.total ?? 0) - parseFloat(order?.amount_paid ?? 0));
  const fullyReturned = order?.fully_returned === true;
  // Default true when the field is absent so we never hide an allowed action on a stale payload.
  const hasReturnable = order?.has_returnable !== false;

  const transitions = VALID_TRANSITIONS[status] ?? [];

  return {
    // Non-cancel fulfilment transitions — none once the order is fully returned (INV-4).
    canTransitionTo: fullyReturned ? [] : transitions.filter((s) => s !== 'cancelled'),
    // Cancel is allowed wherever the backend transition map permits it (never blocked by returns).
    canCancel: transitions.includes('cancelled'),
    // Payment allowed unless cancelled, and only while a NET balance remains
    // (mirrors the backend cancelled block + net-payable overpayment guard).
    canRecordPayment: status !== 'cancelled' && remaining > 0.005,
    // Returns: only on delivered orders that still have something returnable (INV-5).
    canCreateReturn: status === 'delivered' && hasReturnable,
  };
}
