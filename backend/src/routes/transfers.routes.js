'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/transfers.controller');

router.use(authenticate);

router.get('/', [
  qv('status').optional().isIn(['pending', 'completed', 'cancelled']),
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 100 }),
], validate, ctrl.list);

router.post('/', requireMinRole('staff'), [
  body('from_location_id').isUUID().withMessage('from_location_id must be a UUID'),
  body('to_location_id').isUUID().withMessage('to_location_id must be a UUID'),
  body('note').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isUUID().withMessage('Each item must have a valid product_id'),
  body('items.*.variant_id').optional({ nullable: true }).isUUID(),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], validate, ctrl.create);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);

router.post('/:id/confirm', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.confirm);

router.post('/:id/cancel', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.cancel);

module.exports = router;
