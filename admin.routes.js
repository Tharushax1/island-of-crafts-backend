const express = require('express');

const router = express.Router();

const adminController = require('./admin.controller');

const {
  protect,
  requireRole,
} = require('./auth.middleware');


// ======================================================
// DASHBOARD STATISTICS
// GET /api/admin/dashboard
// ======================================================

router.get(
  '/dashboard',
  protect,
  requireRole('admin'),
  adminController.getDashboardStats
);


// ======================================================
// GET PENDING ARTISANS
// GET /api/admin/artisans/pending
// ======================================================

router.get(
  '/artisans/pending',
  protect,
  requireRole('admin'),
  adminController.getPendingArtisans
);


// ======================================================
// APPROVE ARTISAN
// PUT /api/admin/artisans/:id/approve
// ======================================================

router.put(
  '/artisans/:id/approve',
  protect,
  requireRole('admin'),
  adminController.approveArtisan
);


// ======================================================
// REJECT ARTISAN
// PUT /api/admin/artisans/:id/reject
// ======================================================

router.put(
  '/artisans/:id/reject',
  protect,
  requireRole('admin'),
  adminController.rejectArtisan
);


// ======================================================
// GET PENDING PRODUCTS
// GET /api/admin/products/pending
// ======================================================

router.get(
  '/products/pending',
  protect,
  requireRole('admin'),
  adminController.getPendingProducts
);


module.exports = router;