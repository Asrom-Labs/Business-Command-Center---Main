'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/products.controller');
const variantRoutes = require('./product-variants.routes');

router.use(authenticate);

router.get('/', [
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 100 }),
  qv('category_id').optional().isUUID(),
  qv('active').optional().isBoolean(),
], validate, ctrl.list);

router.post('/', requireMinRole('admin'), [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 255 }),
  body('sku').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('barcode').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('price').optional({ nullable: true }).isFloat({ min: 0 }),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }),
  body('low_stock_threshold').optional({ nullable: true }).isInt({ min: 0 }),
  body('category_id').optional({ nullable: true }).isUUID(),
  body('unit_id').optional({ nullable: true }).isUUID(),
], validate, ctrl.create);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);

router.patch('/:id', requireMinRole('admin'), [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('sku').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('barcode').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('price').optional({ nullable: true }).isFloat({ min: 0 }),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }),
  body('low_stock_threshold').optional({ nullable: true }).isInt({ min: 0 }),
  body('category_id').optional({ nullable: true }).isUUID(),
  body('unit_id').optional({ nullable: true }).isUUID(),
  body('active').optional().isBoolean(),
], validate, ctrl.update);

router.delete('/:id', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.remove);

// Mount variant routes
router.use('/:productId/variants', variantRoutes);

module.exports = router;
