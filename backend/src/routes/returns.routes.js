'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/returns.controller');

router.use(authenticate);

router.get('/reasons', ctrl.listReasons);

router.get('/', [
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 100 }),
], validate, ctrl.list);

router.post('/', requireMinRole('staff'), [
  body('sales_order_id').isUUID().withMessage('sales_order_id is required'),
  body('reason_id').optional({ nullable: true }).isUUID(),
  body('note').optional({ nullable: true }).trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.sales_order_item_id').isUUID(),
  body('items.*.quantity_returned').isInt({ min: 1 }),
  body('items.*.refund_amount').optional({ nullable: true }).isFloat({ min: 0, max: 999999 }),
], validate, ctrl.create);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);

module.exports = router;
