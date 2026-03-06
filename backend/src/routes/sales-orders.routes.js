'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/sales-orders.controller');

router.use(authenticate);

router.get('/', [
  qv('status').optional().isIn(['pending', 'partially_paid', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']),
  qv('channel').optional().isIn(['in_store', 'whatsapp', 'instagram', 'snapchat', 'tiktok', 'online', 'other']),
  qv('customer_id').optional().isUUID(),
  qv('location_id').optional().isUUID(),
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 100 }),
], validate, ctrl.list);

router.post('/', requireMinRole('staff'), [
  body('location_id').isUUID().withMessage('location_id is required'),
  body('customer_id').optional({ nullable: true }).isUUID(),
  body('channel').optional().isIn(['in_store', 'whatsapp', 'instagram', 'snapchat', 'tiktok', 'online', 'other']),
  body('discount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('tax').optional({ nullable: true }).isFloat({ min: 0 }),
  body('note').optional({ nullable: true }).trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isUUID(),
  body('items.*.variant_id').optional({ nullable: true }).isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.price').optional({ nullable: true }).isFloat({ min: 0 }),
  body('items.*.discount').optional({ nullable: true }).isFloat({ min: 0 }),
], validate, ctrl.create);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);

router.patch('/:id/status', requireMinRole('staff'), [
  param('id').isUUID(),
  body('status').isIn(['pending', 'partially_paid', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
], validate, ctrl.updateStatus);

module.exports = router;
