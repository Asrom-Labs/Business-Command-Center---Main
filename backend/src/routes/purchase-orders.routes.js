'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/purchase-orders.controller');

router.use(authenticate);

router.get('/', [
  qv('status').optional().isIn(['draft', 'submitted', 'partially_received', 'received', 'cancelled']),
  qv('supplier_id').optional().isUUID(),
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 100 }),
], validate, ctrl.list);

router.post('/', requireMinRole('admin'), [
  body('supplier_id').isUUID().withMessage('supplier_id is required'),
  body('location_id').isUUID().withMessage('location_id is required'),
  body('expected_date').optional({ nullable: true }).isISO8601().withMessage('expected_date must be a valid date'),
  body('note').optional({ nullable: true }).trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isUUID(),
  body('items.*.variant_id').optional({ nullable: true }).isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.unit_cost').isFloat({ min: 0 }),
], validate, ctrl.create);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);

router.patch('/:id/status', requireMinRole('admin'), [
  param('id').isUUID(),
  body('status').isIn(['submitted', 'partially_received', 'received', 'cancelled']).withMessage('Invalid status'),
], validate, ctrl.updateStatus);

// Staff can receive goods against a submitted or partially-received PO.
// Intentionally lower than the 'admin' required to create the PO: warehouse
// staff receive deliveries without needing order-creation privileges.
router.post('/:id/receive', requireMinRole('staff'), [
  param('id').isUUID(),
  body('note').optional({ nullable: true }).trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.purchase_order_item_id').optional({ nullable: true }).isUUID(),
  body('items.*.product_id').optional({ nullable: true }).isUUID(),
  body('items.*').custom((item) => {
    if (!item.purchase_order_item_id && !item.product_id) {
      throw new Error('Each item must include either purchase_order_item_id or product_id');
    }
    return true;
  }),
  body('items.*.quantity_received').isInt({ min: 1 }),
], validate, ctrl.receive);

module.exports = router;
