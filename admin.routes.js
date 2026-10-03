const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getPendingArtisans,
  approveArtisan,
  getPendingProducts
} = require('./admin.controller');

const {
  protect,
  requireRole
} = require('./auth.middleware');

router.get(
  '/dashboard',
  protect,
  requireRole('admin'),
  getDashboardStats
);
router.get(
  '/artisans/pending',
  protect,
  requireRole('admin'),
  getPendingArtisans
);

router.put(
  '/artisans/:id/approve',
  protect,
  requireRole('admin'),
  approveArtisan
);

router.get(
  '/products/pending',
  protect,
  requireRole('admin'),
  getPendingProducts
);

module.exports = router;