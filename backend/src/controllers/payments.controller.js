'use strict';

const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');

const listForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const orgId = req.user.org_id;

    const soChk = await pool.query(
      `SELECT id, total, amount_paid FROM sales_orders WHERE id = $1 AND organization_id = $2`, [orderId, orgId]
    );
    if (!soChk.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Sales order not found' });
    }

    const result = await pool.query(
      `SELECT p.*, u.name AS created_by_name FROM payments p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.sales_order_id = $1 ORDER BY p.paid_at DESC`,
      [orderId]
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { amount, method, note = null } = req.body;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      const soRes = await client.query(
        `SELECT id, total, amount_paid, status, customer_id FROM sales_orders WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
        [orderId, orgId]
      );
      if (!soRes.rows.length) {
        const err = new Error('Sales order not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }
      const so = soRes.rows[0];
      if (so.status === 'cancelled') {
        const err = new Error('Cannot add payment to a cancelled order');
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      const payment = await client.query(
        `INSERT INTO payments (organization_id, sales_order_id, amount, method, note, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [orgId, orderId, amount, method, note, req.user.id]
      );

      const newAmountPaid = parseFloat(so.amount_paid) + parseFloat(amount);
      const orderTotal = parseFloat(so.total);

      if (newAmountPaid > orderTotal + 0.01) {
        const remaining = (orderTotal - parseFloat(so.amount_paid)).toFixed(2);
        const err = new Error(`Payment exceeds order total. Remaining balance: ${remaining}`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'OVERPAYMENT'; throw err;
      }

      const newStatus = newAmountPaid >= orderTotal - 0.01 ? 'paid' : 'partially_paid';
      await client.query(
        `UPDATE sales_orders SET amount_paid = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [newAmountPaid, newStatus, orderId]
      );

      // If payment is via credit (extend credit to customer), add to their credit balance
      if (method === 'credit') {
        if (so.customer_id) {
          await client.query(
            `UPDATE customers SET credit_balance = credit_balance + $1 WHERE id = $2`,
            [amount, so.customer_id]
          );
        }
      }

      // If payment is via store_credit (customer redeeming their credit), deduct from their balance
      if (method === 'store_credit') {
        if (!so.customer_id) {
          const err = new Error('Store credit payments require an order linked to a customer');
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
        }
        const custRes = await client.query(
          `SELECT credit_balance FROM customers WHERE id = $1 FOR UPDATE`, [so.customer_id]
        );
        if (!custRes.rows.length || parseFloat(custRes.rows[0].credit_balance) < parseFloat(amount)) {
          const err = new Error('Insufficient store credit balance');
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
        }
        await client.query(
          `UPDATE customers SET credit_balance = credit_balance - $1 WHERE id = $2`,
          [amount, so.customer_id]
        );
      }

      await auditService.log({ client, orgId, userId: req.user.id, action: 'create', entity: 'payments', entityId: payment.rows[0].id });
      return payment.rows[0];
    });

    return res.status(201).json({ success: true, data: result, message: 'Payment recorded' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `SELECT p.*, u.name AS created_by_name
       FROM payments p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = $1 AND p.organization_id = $2`,
      [req.params.id, orgId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Payment not found' });
    }
    return res.json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

module.exports = { listForOrder, create, getOne };
