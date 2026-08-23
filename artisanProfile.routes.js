const express = require('express');
const router = express.Router();
const artisanProfileController = require('./artisanProfile.controller');
const { protect, requireRole } = require('./auth.middleware');

// Public — directory of all artisans, and individual storefront pages
router.get('/artisans', artisanProfileController.getAllProfiles);
router.get('/storefront/:storeSlug', artisanProfileController.getStorefrontBySlug);

// Protected — only the artisan themself manages their profile
router.post('/artisan-profile', protect, requireRole('artisan'), artisanProfileController.createProfile);
router.put('/artisan-profile', protect, requireRole('artisan'), artisanProfileController.updateProfile);

module.exports = router;
