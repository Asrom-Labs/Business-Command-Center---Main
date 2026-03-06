'use strict';

const { pool } = require('../db/pool');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const { entity, action, user_id, from, to } = req.query;
    const orgId = req.user.org_id;

    if (from && to && new Date(from) > new Date(to)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'VALIDATION_ERROR',
        message: 'from date must be before or equal to to date',
      });
    }

    const vals = [orgId];
    let w = 'WHERE al.organization_id = $1'; let idx = 2;
    if (entity) { w += ` AND al.entity = $${idx++}`; vals.push(entity); }
    if (action) { w += ` AND al.action = $${idx++}`; vals.push(action); }
    if (user_id) { w += ` AND al.user_id = $${idx++}`; vals.push(user_id); }
    if (from) { w += ` AND al.created_at >= $${idx++}`; vals.push(from); }
    if (to) { w += ` AND al.created_at < ($${idx++}::DATE + INTERVAL '1 day')`; vals.push(to); }

    const countRes = await pool.query(`SELECT COUNT(*) FROM audit_log al ${w}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT al.id, al.organization_id, al.user_id, u.name AS user_name,
              al.action, al.entity, al.entity_id, al.changes, al.created_at
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.user_id
       ${w}
       ORDER BY al.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      vals
    );

    return res.json({
      success: true, data: dataRes.rows, message: 'Success',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

module.exports = { list };
