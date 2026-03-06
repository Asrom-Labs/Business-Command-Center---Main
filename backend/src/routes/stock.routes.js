'use strict';

const express = require('express');
const router = express.Router();
const { body, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/stock.controller');

router.use(authenticate);

router.get('/', [
  qv('location_id').optional().isUUID(),
  qv('product_id').optional().isUUID(),
  qv('low_stock').optional().isBoolean(),
], validate, ctrl.getStock);

router.get('/summary', requireMinRole('staff'), ctrl.getSummary);

router.get('/ledger', [
  qv('product_id').optional().isUUID(),
  qv('location_id').optional().isUUID(),
  qv('movement_type').optional().isIn(['purchase', 'sale', 'transfer_in', 'transfer_out', 'return', 'adjustment', 'cancellation']),
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 200 }),
], validate, ctrl.getLedger);

router.post('/adjust', requireMinRole('admin'), [
  body('product_id').isUUID().withMessage('product_id is required'),
  body('variant_id').optional({ nullable: true }).isUUID(),
  body('location_id').isUUID().withMessage('location_id is required'),
  body('quantity_change').isInt().withMessage('quantity_change must be an integer').custom((v) => v !== 0).withMessage('quantity_change must be non-zero'),
  body('note').optional({ nullable: true }).trim(),
], validate, ctrl.adjust);

module.exports = router;
