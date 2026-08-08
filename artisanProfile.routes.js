const express = require('express');
const router = express.Router();
const artisanProfileController = require('./artisanProfile.controller');
const { protect, requireRole } = require('./auth.middleware');

// Public — the actual storefront page customers browse
router.get('/storefront/:storeSlug', artisanProfileController.getStorefrontBySlug);

// Protected — only the artisan themself manages their profile
router.post('/artisan-profile', protect, requireRole('artisan'), artisanProfileController.createProfile);
router.put('/artisan-profile', protect, requireRole('artisan'), artisanProfileController.updateProfile);

module.exports = router;
