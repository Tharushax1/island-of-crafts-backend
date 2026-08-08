const { ArtisanProfile, Product } = require('./models');

const toSlug = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─────────────────────────────────────────────
// CREATE / SETUP — POST /api/artisan-profile
// Artisan sets up their storefront (one per artisan)
// ─────────────────────────────────────────────
exports.createProfile = async (req, res) => {
  try {
    const existing = await ArtisanProfile.findOne({ user: req.user._id });
    if (existing) return res.status(400).json({ message: 'Profile already exists — use update instead' });

    const { storeName, bio, story, craftSpecialty, location, profileImage, coverImage, galleryImages } = req.body;
    if (!storeName) return res.status(400).json({ message: 'storeName is required' });

    let storeSlug = toSlug(storeName);
    const slugTaken = await ArtisanProfile.findOne({ storeSlug });
    if (slugTaken) storeSlug = `${storeSlug}-${req.user._id.toString().slice(-4)}`; // make unique

    const profile = await ArtisanProfile.create({
      user: req.user._id,
      storeName,
      storeSlug,
      bio,
      story,
      craftSpecialty,
      location,
      profileImage,
      coverImage,
      galleryImages,
    });

    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create profile', error: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE — PUT /api/artisan-profile
// Artisan edits their own storefront/story content
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const profile = await ArtisanProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found — create one first' });

    const editable = ['bio', 'story', 'craftSpecialty', 'location', 'profileImage', 'coverImage', 'galleryImages'];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) profile[field] = req.body[field];
    });

    // storeName changes regenerate the slug
    if (req.body.storeName && req.body.storeName !== profile.storeName) {
      profile.storeName = req.body.storeName;
      profile.storeSlug = toSlug(req.body.storeName);
    }

    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// ─────────────────────────────────────────────
// PUBLIC STOREFRONT PAGE — GET /api/storefront/:storeSlug
// Returns artisan story + their approved products together —
// this is the single call the storefront page needs.
// ─────────────────────────────────────────────
exports.getStorefrontBySlug = async (req, res) => {
  try {
    const profile = await ArtisanProfile.findOne({ storeSlug: req.params.storeSlug });
    if (!profile) return res.status(404).json({ message: 'Storefront not found' });

    const products = await Product.find({ artisan: profile.user, status: 'approved' })
      .populate('category', 'name slug');

    res.json({ profile, products });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch storefront', error: err.message });
  }
};
