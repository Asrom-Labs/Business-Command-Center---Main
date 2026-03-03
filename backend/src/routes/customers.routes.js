'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/customers.controller');

router.use(authenticate);

router.get('/', [
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 100 }),
], validate, ctrl.list);

router.post('/', requireMinRole('staff'), [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 50 }),
  body('email').optional({ nullable: true }).trim().isEmail().withMessage('Valid email required'),
  body('address').optional({ nullable: true }).trim(),
], validate, ctrl.create);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);

router.patch('/:id', requireMinRole('staff'), [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 50 }),
  body('email').optional({ nullable: true }).trim().isEmail(),
  body('address').optional({ nullable: true }).trim(),
], validate, ctrl.update);

router.delete('/:id', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.remove);

router.post('/:id/notes', requireMinRole('staff'), [
  param('id').isUUID(),
  body('note').trim().notEmpty().withMessage('Note text is required'),
], validate, ctrl.addNote);

module.exports = router;
