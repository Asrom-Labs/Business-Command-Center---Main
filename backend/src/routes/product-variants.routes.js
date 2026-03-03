'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :productId from parent
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/product-variants.controller');

// All routes already protected by authenticate from products.routes.js

router.get('/', ctrl.list);

router.post('/', requireMinRole('admin'), [
  body('name').trim().notEmpty().withMessage('Variant name is required').isLength({ max: 255 }),
  body('sku').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('barcode').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('price').optional({ nullable: true }).isFloat({ min: 0 }),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }),
], validate, ctrl.create);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);

router.patch('/:id', requireMinRole('admin'), [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('sku').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('barcode').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('price').optional({ nullable: true }).isFloat({ min: 0 }),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }),
  body('active').optional().isBoolean(),
], validate, ctrl.update);

router.delete('/:id', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.remove);

module.exports = router;
