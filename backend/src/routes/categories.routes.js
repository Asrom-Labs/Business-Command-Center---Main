'use strict';

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/categories.controller');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', requireMinRole('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
], validate, ctrl.create);
router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);
router.patch('/:id', requireMinRole('admin'), [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
], validate, ctrl.update);
router.delete('/:id', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.remove);

module.exports = router;
