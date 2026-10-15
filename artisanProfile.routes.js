const express = require('express');
const router = express.Router();

const artisanProfileController = require('./artisanProfile.controller');

const {
protect,
requireRole,
requireVerifiedArtisan,
} = require('./auth.middleware');

// ======================================================
// PUBLIC ARTISAN DIRECTORY
// GET /api/artisans
// ======================================================

router.get(
'/artisans',
artisanProfileController.getAllProfiles
);

// ======================================================
// PUBLIC STOREFRONT
// GET /api/storefront/
// ======================================================

router.get(
'/storefront/',
artisanProfileController.getStorefrontBySlug
);

// ======================================================
// ARTISAN STATUS
// GET /api/artisan-status
// ======================================================

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

// ======================================================
// GET MY ARTISAN PROFILE
// GET /api/my-artisan-profile
// ======================================================

router.get(
'/my-artisan-profile',
protect,
requireVerifiedArtisan,
artisanProfileController.getMyProfile
);

// ======================================================
// CREATE ARTISAN PROFILE
// POST /api/artisan-profile
// ======================================================

router.post(
'/artisan-profile',
protect,
requireVerifiedArtisan,
artisanProfileController.createProfile
);

// ======================================================
// UPDATE ARTISAN PROFILE
// PUT /api/artisan-profile
// ======================================================

router.put(
'/artisan-profile',
protect,
requireVerifiedArtisan,
artisanProfileController.updateProfile
);

module.exports = router;