'use strict';

const express = require('express');
const router = express.Router();
const { query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/audit-log.controller');

router.use(authenticate);

router.get('/', requireMinRole('admin'), [
  qv('entity').optional().trim(),
  qv('action').optional().trim(),
  qv('user_id').optional().isUUID(),
  qv('from').optional().isISO8601(),
  qv('to').optional().isISO8601(),
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 200 }),
], validate, ctrl.list);

module.exports = router;
