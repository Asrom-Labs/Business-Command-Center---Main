'use strict';

const { pool } = require('../db/pool');
const auditService = require('../services/audit.service');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    const vals = [];
    let w = ''; let idx = 1;
    if (search) { w = `WHERE name ILIKE $${idx++}`; vals.push(search); }

    const c = await pool.query(`SELECT COUNT(*) FROM units ${w}`, vals);
    vals.push(limit, offset);
    const d = await pool.query(`SELECT * FROM units ${w} ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`, vals);
    return res.json({ success: true, data: d.rows, message: 'Success', pagination: { page, limit, total: parseInt(c.rows[0].count), totalPages: Math.ceil(parseInt(c.rows[0].count) / limit) } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const r = await pool.query(`INSERT INTO units (name) VALUES ($1) RETURNING *`, [req.body.name.trim()]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'create', entity: 'units', entityId: r.rows[0].id });
    return res.status(201).json({ success: true, data: r.rows[0], message: 'Unit created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const r = await pool.query(`SELECT * FROM units WHERE id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Unit not found' });
    return res.json({ success: true, data: r.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const chk = await pool.query(`SELECT id FROM units WHERE id = $1`, [req.params.id]);
    if (!chk.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Unit not found' });
    const r = await pool.query(`UPDATE units SET name = $1 WHERE id = $2 RETURNING *`, [req.body.name.trim(), req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'units', entityId: req.params.id });
    return res.json({ success: true, data: r.rows[0], message: 'Unit updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const chk = await pool.query(`SELECT id FROM units WHERE id = $1`, [req.params.id]);
    if (!chk.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Unit not found' });
    await pool.query(`DELETE FROM units WHERE id = $1`, [req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'units', entityId: req.params.id });
    return res.json({ success: true, data: null, message: 'Unit deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove };
