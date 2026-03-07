'use strict';

const { pool } = require('../db/pool');
const auditService = require('../services/audit.service');

const getMyOrg = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, country, currency, created_at, updated_at FROM organizations WHERE id = $1`,
      [req.user.org_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Organization not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) {
    next(err);
  }
};

const updateMyOrg = async (req, res, next) => {
  try {
    const { name, country, currency } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name.trim()); }
    if (country !== undefined) { updates.push(`country = $${idx++}`); values.push(country.trim()); }
    if (currency !== undefined) { updates.push(`currency = $${idx++}`); values.push(currency.trim()); }

    if (!updates.length) {
      return res.status(400).json({ success: false, data: null, error: 'NO_CHANGES', message: 'No valid fields provided for update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.org_id);

    const result = await pool.query(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'organizations', entityId: req.user.org_id });

    return res.status(200).json({ success: true, data: result.rows[0], message: 'Organization updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyOrg, updateMyOrg };
