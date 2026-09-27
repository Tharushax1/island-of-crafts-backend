const express = require('express');
const router = express.Router();

const cartController = require('./cart.controller');
const { protect, requireRole } = require('./auth.middleware');

// All cart operations require a logged-in customer
router.get(
  '/',
  protect,
  requireRole('customer'),
  cartController.getCart
);

router.post(
  '/',
  protect,
  requireRole('customer'),
  cartController.addToCart
);

router.put(
  '/:productId',
  protect,
  requireRole('customer'),
  cartController.updateCartItem
);

router.delete(
  '/:productId',
  protect,
  requireRole('customer'),
  cartController.removeFromCart
);

router.delete(
  '/',
  protect,
  requireRole('customer'),
  cartController.clearCart
);

module.exports = router;