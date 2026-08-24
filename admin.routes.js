const express = require('express');

const router = express.Router();

const adminController = require('./admin.controller');

const { protect, requireRole } = require('./auth.middleware');

// Get all pending artisans
router.get(
  '/artisans/pending',
  protect,
  requireRole('admin'),
  adminController.getPendingArtisans
);

// Approve artisan
router.put(
  '/artisans/:id/approve',
  protect,
  requireRole('admin'),
  adminController.approveArtisan
);

// Reject artisan
router.put(
  '/artisans/:id/reject',
  protect,
  requireRole('admin'),
  adminController.rejectArtisan
);

module.exports = router;