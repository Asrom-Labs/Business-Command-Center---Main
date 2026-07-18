'use strict';

const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');
const stockService = require('../services/stock.service');
const taxService = require('../services/tax.service');
const orderFinance = require('../services/order-finance.service');

// Half-up rounding to 2 decimal places (money scale, D2). All order money here is
// non-negative, so Math.round (which rounds .5 up for positives) gives half-up.
const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { status, channel, customer_id, location_id } = req.query;

    const vals = [req.user.org_id];
    let w = 'WHERE so.organization_id = $1'; let idx = 2;
    if (status) { w += ` AND so.status = $${idx++}`; vals.push(status); }
    if (channel) { w += ` AND so.channel = $${idx++}`; vals.push(channel); }
    if (customer_id) { w += ` AND so.customer_id = $${idx++}`; vals.push(customer_id); }
    if (location_id) { w += ` AND so.location_id = $${idx++}`; vals.push(location_id); }

    const countRes = await pool.query(`SELECT COUNT(*) FROM sales_orders so ${w}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT so.*, COALESCE(c.name, so.customer_name) AS customer_name, l.name AS location_name, u.name AS user_name,
              ${orderFinance.REFUNDED_TOTAL_SUBQUERY} AS refunded_total
       FROM sales_orders so
       LEFT JOIN customers c ON c.id = so.customer_id
       JOIN locations l ON l.id = so.location_id
       LEFT JOIN users u ON u.id = so.user_id
       ${w}
       ORDER BY so.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      vals
    );
    // Attach the net figures so the frontend never computes payable itself (INV-2).
    const rows = dataRes.rows.map((row) => {
      const fin = orderFinance.deriveOrderFinance(row.total, row.refunded_total, row.amount_paid);
      return { ...row, refunded_total: parseFloat(row.refunded_total), ...fin };
    });
    return res.json({
      success: true, data: rows, message: 'Success',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const {
      customer_id = null, customer_name = null, location_id, channel = 'walk_in',
      channel_detail = null, discount = 0, tax_rate, note = null, items,
    } = req.body;
    const orgId = req.user.org_id;

    // One-time/walk-in customers carry their name on the order row itself.
    // A registered customer already has a name via the join, so customer_name
    // is ignored when customer_id is present. Whitespace-only never reaches the DB.
    const oneTimeName = customer_id
      ? null
      : (typeof customer_name === 'string' && customer_name.trim() !== '' ? customer_name.trim() : null);

    // channel_detail is only meaningful for the 'other' channel: trim, empty → NULL,
    // and force NULL for any non-'other' channel regardless of what was sent (BUG-14 pattern).
    const normalizedChannelDetail = channel === 'other'
      ? (typeof channel_detail === 'string' && channel_detail.trim() !== '' ? channel_detail.trim() : null)
      : null;

    const result = await withTransaction(async (client) => {
      // Validate location
      const locChk = await client.query(
        `SELECT l.id FROM locations l JOIN branches b ON b.id = l.branch_id WHERE l.id = $1 AND b.organization_id = $2`,
        [location_id, orgId]
      );
      if (!locChk.rows.length) {
        const err = new Error('Location not found'); err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
      }

      // Resolve org currency and enforce that tax_rate is a member of the allowed set (D4).
      const orgRes = await client.query(`SELECT currency FROM organizations WHERE id = $1`, [orgId]);
      const currency = orgRes.rows.length ? orgRes.rows[0].currency : null;
      const allowedRates = taxService.getAllowedTaxRates(currency);
      const taxRateNum = parseFloat(tax_rate);
      if (!allowedRates.includes(taxRateNum)) {
        const err = new Error(`tax_rate ${tax_rate} is not allowed for currency ${currency}. Allowed rates: ${allowedRates.join(', ')}`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
      }

      // Validate customer if provided
      if (customer_id) {
        const custChk = await client.query(`SELECT id FROM customers WHERE id = $1 AND organization_id = $2 AND active = TRUE`, [customer_id, orgId]);
        if (!custChk.rows.length) {
          const err = new Error('Customer not found'); err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }
      }

      // ── Canonical SO totals math — THE single source of truth. The frontend
      //    totals panel mirrors this exactly; never let them diverge. All money
      //    is half-up rounded to 2dp (D2). subtotal is GROSS (pre-discount). ──
      let subtotal = 0;         // Σ round(qty * price)
      let lineDiscounts = 0;    // Σ per-line discount

      const resolvedItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const { product_id, variant_id = null, quantity, price: overridePrice = null, discount: itemDiscount = 0 } = item;

        const prodRes = await client.query(
          `SELECT p.price, p.cost, pv.price AS var_price, pv.cost AS var_cost
           FROM products p
           LEFT JOIN product_variants pv ON pv.id = $2
           WHERE p.id = $1 AND p.organization_id = $3 AND p.active = TRUE`,
          [product_id, variant_id, orgId]
        );
        if (!prodRes.rows.length) {
          const err = new Error('Product not found or is not active');
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }

        if (variant_id) {
          const varChk = await client.query(
            `SELECT id FROM product_variants WHERE id = $1 AND product_id = $2 AND active = TRUE`,
            [variant_id, product_id]
          );
          if (!varChk.rows.length) {
            const err = new Error('Variant does not belong to the specified product or is inactive');
            err.isAppError = true;
            err.statusCode = 422;
            err.errorCode = 'VALIDATION_ERROR';
            throw err;
          }
        }

        const prod = prodRes.rows[0];
        const effectivePrice = parseFloat(overridePrice !== null ? overridePrice : (prod.var_price !== null ? prod.var_price : prod.price || 0));
        const effectiveCost = parseFloat(prod.var_cost !== null ? prod.var_cost : prod.cost || 0);
        const qty = parseInt(quantity, 10);
        const lineDiscount = parseFloat(itemDiscount || 0);
        const lineGross = roundMoney(qty * effectivePrice);

        // Per-line guard: 0 <= discount <= qty * price.
        if (lineDiscount < 0 || lineDiscount > lineGross) {
          const err = new Error(`Line ${i + 1}: discount must be between 0 and the line total (${lineGross.toFixed(2)})`);
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }

        subtotal = roundMoney(subtotal + lineGross);
        lineDiscounts = roundMoney(lineDiscounts + lineDiscount);

        resolvedItems.push({ product_id, variant_id, quantity: qty, price: effectivePrice, discount: lineDiscount, cost: effectiveCost });
      }

      const orderDiscount = roundMoney(parseFloat(discount || 0));   // order-level (D3(c)); 0 for new orders
      const taxableBase = roundMoney(subtotal - lineDiscounts - orderDiscount);
      if (taxableBase < 0) {
        const err = new Error('Order discount cannot exceed the discounted subtotal');
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }
      const taxAmount = roundMoney(taxableBase * taxRateNum / 100);
      const total = roundMoney(taxableBase + taxAmount);

      const soRes = await client.query(
        `INSERT INTO sales_orders
           (organization_id, customer_id, customer_name, location_id, user_id, channel, channel_detail,
            status, subtotal, discount, tax, tax_rate, total, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12, $13) RETURNING *`,
        [orgId, customer_id, oneTimeName, location_id, req.user.id, channel, normalizedChannelDetail,
         subtotal, orderDiscount, taxAmount, taxRateNum, total, note]
      );
      const soId = soRes.rows[0].id;

      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO sales_order_items (sales_order_id, product_id, variant_id, quantity, price, discount, cost)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [soId, item.product_id, item.variant_id, item.quantity, item.price, item.discount, item.cost]
        );

        // Deduct stock
        await stockService.insertLedgerEntry(client, {
          productId: item.product_id,
          variantId: item.variant_id,
          locationId: location_id,
          changeQty: -item.quantity,
          movementType: 'sale',
          referenceId: soId,
          note: `Sale order`,
          createdBy: req.user.id,
        });
      }

      await auditService.log({ client, orgId, userId: req.user.id, action: 'create', entity: 'sales_orders', entityId: soId });
      return soRes.rows[0];
    });

    return res.status(201).json({ success: true, data: result, message: 'Sales order created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const soRes = await pool.query(
      `SELECT so.*, COALESCE(c.name, so.customer_name) AS customer_name, l.name AS location_name, u.name AS user_name
       FROM sales_orders so
       LEFT JOIN customers c ON c.id = so.customer_id
       JOIN locations l ON l.id = so.location_id
       LEFT JOIN users u ON u.id = so.user_id
       WHERE so.id = $1 AND so.organization_id = $2`,
      [id, orgId]
    );
    if (!soRes.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Sales order not found' });
    }

    const itemsRes = await pool.query(
      `SELECT soi.*, p.name AS product_name, pv.name AS variant_name,
              COALESCE((SELECT SUM(ri.quantity_returned) FROM return_items ri WHERE ri.sales_order_item_id = soi.id), 0)::INTEGER AS already_returned
       FROM sales_order_items soi
       JOIN products p ON p.id = soi.product_id
       LEFT JOIN product_variants pv ON pv.id = soi.variant_id
       WHERE soi.sales_order_id = $1`,
      [id]
    );

    const paymentsRes = await pool.query(
      `SELECT * FROM payments WHERE sales_order_id = $1 ORDER BY paid_at DESC`, [id]
    );

    const so = soRes.rows[0];
    so.items = itemsRes.rows;
    so.payments = paymentsRes.rows;

    // Refund-aware finance + return status (INV-2/3/4/5). Single source: order-finance.service.
    const { refundedTotal, fullyReturned, hasReturnable } = await orderFinance.getOrderReturnSummary(pool, id);
    const fin = orderFinance.deriveOrderFinance(so.total, refundedTotal, so.amount_paid);
    so.refunded_total = refundedTotal;
    so.net_payable = fin.net_payable;
    so.remaining = fin.remaining;
    so.credit_owed = fin.credit_owed;
    so.fully_returned = fullyReturned;
    so.has_returnable = hasReturnable;

    return res.json({ success: true, data: so, message: 'Success' });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      const chk = await client.query(
        `SELECT so.status, so.location_id FROM sales_orders so WHERE so.id = $1 AND so.organization_id = $2 FOR UPDATE`,
        [id, orgId]
      );
      if (!chk.rows.length) {
        const err = new Error('Sales order not found');
        err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }

      const current = chk.rows[0].status;
      const locationId = chk.rows[0].location_id;

      // paid and partially_paid are set exclusively by the payments system, not manually
      if (status === 'paid' || status === 'partially_paid') {
        const err = new Error(`Status '${status}' is managed automatically by the payments system`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      const validTransitions = {
        pending:        ['processing', 'cancelled'],
        partially_paid: ['processing', 'cancelled'],
        paid:           ['processing', 'shipped'],
        processing:     ['shipped', 'cancelled'],
        shipped:        ['delivered'],
        delivered:      [],
        cancelled:      [],
      };
      if (!validTransitions[current] || !validTransitions[current].includes(status)) {
        const err = new Error(`Cannot transition sales order from '${current}' to '${status}'`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      // INV-4: a fulfilment-advancing transition is refused when the order is FULLY
      // returned (nothing left to fulfil). A PARTIAL return does not block — the
      // un-returned remainder still ships. Cancellation is never blocked here.
      if (status === 'processing' || status === 'shipped' || status === 'delivered') {
        const { fullyReturned } = await orderFinance.getOrderReturnSummary(client, id);
        if (fullyReturned) {
          const err = new Error('Cannot advance a fully-returned order — nothing remains to fulfil');
          err.isAppError = true; err.statusCode = 409; err.errorCode = 'BUSINESS_RULE'; throw err;
        }
      }

      // On cancellation, restore stock for all items net of any prior returns
      if (status === 'cancelled') {
        const itemsRes = await client.query(
          `SELECT soi.product_id, soi.variant_id, soi.quantity,
                  COALESCE(SUM(ri.quantity_returned), 0)::INTEGER AS already_returned
           FROM sales_order_items soi
           LEFT JOIN return_items ri ON ri.sales_order_item_id = soi.id
           WHERE soi.sales_order_id = $1
           GROUP BY soi.id`,
          [id]
        );

        for (const item of itemsRes.rows) {
          const restoreQty = item.quantity - item.already_returned;
          if (restoreQty > 0) {
            await stockService.insertLedgerEntry(client, {
              productId: item.product_id,
              variantId: item.variant_id,
              locationId,
              changeQty: restoreQty,
              movementType: 'cancellation',
              referenceId: id,
              note: `Stock restored on order cancellation`,
              createdBy: req.user.id,
            });
          }
        }
      }

      const updated = await client.query(
        `UPDATE sales_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, id]
      );
      await auditService.log({ client, orgId, userId: req.user.id, action: 'status_change', entity: 'sales_orders', entityId: id, changes: { from: current, to: status } });
      return updated.rows[0];
    });

    return res.json({ success: true, data: result, message: 'Status updated' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, updateStatus };
