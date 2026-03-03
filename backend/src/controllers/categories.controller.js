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
    if (search) { w += ` AND name ILIKE $${idx++}`; vals.push(search); }

    const c = await pool.query(`SELECT COUNT(*) FROM categories ${w}`, vals);
    vals.push(limit, offset);
    const d = await pool.query(`SELECT * FROM categories ${w} ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`, vals);
    return res.json({ success: true, data: d.rows, message: 'Success', pagination: { page, limit, total: parseInt(c.rows[0].count), totalPages: Math.ceil(parseInt(c.rows[0].count) / limit) } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const r = await pool.query(`INSERT INTO categories (organization_id, name) VALUES ($1, $2) RETURNING *`, [req.user.org_id, req.body.name.trim()]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'create', entity: 'categories', entityId: r.rows[0].id });
    return res.status(201).json({ success: true, data: r.rows[0], message: 'Category created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const r = await pool.query(`SELECT * FROM categories WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Category not found' });
    return res.json({ success: true, data: r.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const chk = await pool.query(`SELECT id FROM categories WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]);
    if (!chk.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Category not found' });
    const r = await pool.query(`UPDATE categories SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [req.body.name.trim(), req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'categories', entityId: req.params.id });
    return res.json({ success: true, data: r.rows[0], message: 'Category updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const chk = await pool.query(`SELECT id FROM categories WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]);
    if (!chk.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Category not found' });
    await pool.query(`DELETE FROM categories WHERE id = $1`, [req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'categories', entityId: req.params.id });
    return res.json({ success: true, data: null, message: 'Category deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove };
