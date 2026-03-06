'use strict';

const { pool } = require('../db/pool');
const auditService = require('../services/audit.service');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    const vals = [req.user.org_id];
    let w = 'WHERE organization_id = $1'; let idx = 2;
    if (search) { w += ` AND (name ILIKE $${idx} OR contact_person ILIKE $${idx})`; vals.push(search); idx++; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM suppliers ${w}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT * FROM suppliers ${w} ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`, vals
    );
    return res.json({
      success: true, data: dataRes.rows, message: 'Success',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, phone = null, email = null, address = null, contact_person = null } = req.body;
    const result = await pool.query(
      `INSERT INTO suppliers (organization_id, name, phone, email, address, contact_person) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.org_id, name.trim(), phone, email, address, contact_person]
    );
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'create', entity: 'suppliers', entityId: result.rows[0].id });
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Supplier created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM suppliers WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Supplier not found' });
    }
    return res.json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const chk = await pool.query(
      `SELECT id FROM suppliers WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Supplier not found' });
    }

    const allowedFields = ['name', 'phone', 'email', 'address', 'contact_person'];
    const sets = []; const vals = []; let idx = 1;
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        sets.push(`${field} = $${idx++}`);
        vals.push(typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]);
      }
    }
    if (!sets.length) {
      return res.status(400).json({ success: false, error: 'NO_CHANGES', message: 'No valid fields provided for update' });
    }
    sets.push(`updated_at = NOW()`);
    vals.push(req.params.id);

    const result = await pool.query(`UPDATE suppliers SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'suppliers', entityId: req.params.id });
    return res.json({ success: true, data: result.rows[0], message: 'Supplier updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const chk = await pool.query(
      `SELECT id FROM suppliers WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Supplier not found' });
    }
    await pool.query(`DELETE FROM suppliers WHERE id = $1`, [req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'suppliers', entityId: req.params.id });
    return res.json({ success: true, data: null, message: 'Supplier deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove };
