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

router.post(
  '/payhere/notify',
  orderController.payHereNotify
);

router.post(
  '/:orderNumber/demo-pay',
  protect,
  requireRole('customer'),
  orderController.demoPayOrder
);

router.get(
  '/:orderNumber/payhere',
  protect,
  requireRole('customer'),
  orderController.createPayHerePayment
);

router.get(
  '/:orderNumber',
  protect,
  requireRole('customer'),
  orderController.getOrder
);

module.exports = router;
