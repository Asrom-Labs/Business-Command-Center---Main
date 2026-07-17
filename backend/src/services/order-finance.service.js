'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Order finance — the SINGLE source of truth for "how much is owed on an order"
// and whether it has been returned. (W5.5-P2.1, the returns-integrity fix.)
//
//   net_payable = total − refunded_total          (floored at 0)
//   remaining   = net_payable − amount_paid       (floored at 0)
//   credit_owed = amount_paid − net_payable        (floored at 0; business owes
//                 the customer — already reflected in customers.credit_balance)
//
// The payments OVERPAYMENT guard, every "remaining" figure (SO detail, payments
// list), the status-transition guard, and the create-return affordance ALL
// consume these. The frontend NEVER computes payable itself — it displays what
// the backend returns.
//
// refunded_total = SUM(returns.total_refund_amount) for the order. Money columns
// are NUMERIC(12,2) so the differences are already 2dp; the +/-0.01 tolerances
// in the payments guard absorb float epsilon (no separate rounding needed here).
// ─────────────────────────────────────────────────────────────────────────────

// Correlated subquery for a per-order refunded total, for use in list SELECTs
// (avoids an N+1 of getOrderReturnSummary). Assumes the sales_orders alias `so`.
// Keep in sync with getOrderReturnSummary's refundedTotal source.
const REFUNDED_TOTAL_SUBQUERY =
  '(SELECT COALESCE(SUM(total_refund_amount), 0) FROM returns WHERE sales_order_id = so.id)';

/**
 * Refund + return-completeness summary for one sales order.
 * @param {object} db  a pg client (inside a transaction) or the pool.
 * @param {string} salesOrderId
 * @returns {Promise<{refundedTotal:number, fullyReturned:boolean, hasReturnable:boolean}>}
 */
async function getOrderReturnSummary(db, salesOrderId) {
  const refundRes = await db.query(
    `SELECT COALESCE(SUM(total_refund_amount), 0)::NUMERIC AS refunded_total
     FROM returns WHERE sales_order_id = $1`,
    [salesOrderId]
  );
  const refundedTotal = parseFloat(refundRes.rows[0].refunded_total);

  // Per-line returned vs ordered across the WHOLE order.
  // fully_returned  = every line has returned_qty >= ordered_qty (nothing left to fulfil).
  // has_returnable  = at least one line still has ordered_qty > returned_qty.
  const qtyRes = await db.query(
    `SELECT soi.quantity,
            COALESCE(SUM(ri.quantity_returned), 0)::INTEGER AS returned
     FROM sales_order_items soi
     LEFT JOIN return_items ri ON ri.sales_order_item_id = soi.id
     WHERE soi.sales_order_id = $1
     GROUP BY soi.id, soi.quantity`,
    [salesOrderId]
  );
  const lines = qtyRes.rows;
  const fullyReturned = lines.length > 0 && lines.every((r) => r.returned >= r.quantity);
  const hasReturnable = lines.some((r) => r.returned < r.quantity);

  return { refundedTotal, fullyReturned, hasReturnable };
}

/**
 * THE payable formula — the single place the net figures are derived.
 * @returns {{net_payable:number, remaining:number, credit_owed:number}}
 */
function deriveOrderFinance(total, refundedTotal, amountPaid) {
  const t = parseFloat(total || 0);
  const r = parseFloat(refundedTotal || 0);
  const p = parseFloat(amountPaid || 0);
  const netPayable = Math.max(0, t - r);
  return {
    net_payable: netPayable,
    remaining: Math.max(0, netPayable - p),
    credit_owed: Math.max(0, p - netPayable),
  };
}

module.exports = { REFUNDED_TOTAL_SUBQUERY, getOrderReturnSummary, deriveOrderFinance };
