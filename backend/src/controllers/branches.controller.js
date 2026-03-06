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
    let w = 'WHERE organization_id = $1 AND active = TRUE';
    let idx = 2;
    if (search) { w += ` AND name ILIKE $${idx++}`; vals.push(search); }

    const countRes = await pool.query(`SELECT COUNT(*) FROM branches ${w}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT * FROM branches ${w} ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`, vals
    );

    return res.json({
      success: true, data: dataRes.rows, message: 'Success',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, city } = req.body;
    const result = await pool.query(
      `INSERT INTO branches (organization_id, name, city) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.org_id, name.trim(), city || null]
    );
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'create', entity: 'branches', entityId: result.rows[0].id });
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Branch created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM branches WHERE id = $1 AND organization_id = $2 AND active = TRUE`,
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Branch not found' });
    return res.json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const existing = await pool.query(`SELECT id FROM branches WHERE id = $1 AND organization_id = $2 AND active = TRUE`, [req.params.id, req.user.org_id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Branch not found' });

    const { name, city } = req.body;
    const updates = []; const values = []; let idx = 1;
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name.trim()); }
    if (city !== undefined) { updates.push(`city = $${idx++}`); values.push(city); }
    if (!updates.length) return res.status(400).json({ success: false, error: 'NO_CHANGES', message: 'No valid fields provided for update' });
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await pool.query(`UPDATE branches SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'branches', entityId: req.params.id });
    return res.json({ success: true, data: result.rows[0], message: 'Branch updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const existing = await pool.query(`SELECT id FROM branches WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Branch not found' });
    await pool.query(`UPDATE branches SET active = FALSE, updated_at = NOW() WHERE id = $1`, [req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'branches', entityId: req.params.id });
    return res.json({ success: true, data: null, message: 'Branch deactivated' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove };
