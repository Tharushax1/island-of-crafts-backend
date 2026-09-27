const express = require('express');

const router = express.Router();

const orderController = require('./order.controller');
const { protect, requireRole } = require('./auth.middleware');

router.post(
  '/',
  protect,
  requireRole('customer'),
  orderController.createOrder
);

router.get(
  '/:orderNumber',
  protect,
  requireRole('customer'),
  orderController.getOrder
);

module.exports = router;
