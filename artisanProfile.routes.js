const express = require('express');
const router = express.Router();
const artisanProfileController = require('./artisanProfile.controller');
// const { protect, requireRole } = require('./auth.middleware');

const {
  protect,
  requireRole,
  requireVerifiedArtisan
} = require('./auth.middleware');

// Public — directory of all artisans, and individual storefront pages
router.get('/artisans', artisanProfileController.getAllProfiles);
router.get('/storefront/:storeSlug', artisanProfileController.getStorefrontBySlug);

// Protected — check the logged-in artisan's approval status
router.get(
  '/artisan-status',
  protect,
  requireRole('artisan'),
  (req, res) => {
    res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        artisanStatus: req.user.artisanStatus,
      },
    });
  }
);

router.get(
  '/my-artisan-profile',
  protect,
  requireVerifiedArtisan,
  artisanProfileController.getMyProfile
);

// Protected — only the artisan themself manages their profile
router.post(
  '/artisan-profile',
  protect,
  requireVerifiedArtisan,
  artisanProfileController.createProfile
);
router.put(
  '/artisan-profile',
  protect,
  requireVerifiedArtisan,
  artisanProfileController.updateProfile
);

module.exports = router;
