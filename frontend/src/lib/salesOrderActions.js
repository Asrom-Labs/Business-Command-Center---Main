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
 *   payments.controller.create: blocks payment only when status === 'cancelled'
 *   (an OVERPAYMENT guard additionally prevents paying more than the total, so a
 *    fully-paid order — amount_paid >= total — can take no further payment).
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
  const total = parseFloat(order?.total ?? 0);
  const amountPaid = parseFloat(order?.amount_paid ?? 0);
  const remaining = total - amountPaid;

  const transitions = VALID_TRANSITIONS[status] ?? [];

  return {
    // Non-cancel fulfillment transitions (e.g. processing, shipped, delivered).
    canTransitionTo: transitions.filter((s) => s !== 'cancelled'),
    // Cancel is allowed only where the backend transition map permits it.
    canCancel: transitions.includes('cancelled'),
    // Payment allowed unless cancelled, and only while a balance remains
    // (mirrors the backend cancelled block + overpayment guard).
    canRecordPayment: status !== 'cancelled' && remaining > 0.005,
    // Returns are created only against delivered orders (mirrors the detail UI rule).
    canCreateReturn: status === 'delivered',
  };
}
