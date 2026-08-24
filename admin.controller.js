const User = require('./user.model');

// ─────────────────────────────────────────────
// GET ALL PENDING ARTISANS
// GET /api/admin/artisans/pending
// ─────────────────────────────────────────────
exports.getPendingArtisans = async (req, res) => {
  try {
    const artisans = await User.find({
      role: 'artisan',
      artisanStatus: 'pending',
    }).select('-password');

    res.status(200).json({
      count: artisans.length,
      artisans,
    });
  } catch (err) {
    console.error('Get pending artisans error:', err);

    res.status(500).json({
      message: 'Failed to fetch pending artisans',
      error: err.message,
    });
  }
};


// ─────────────────────────────────────────────
// APPROVE ARTISAN
// PUT /api/admin/artisans/:id/approve
// ─────────────────────────────────────────────
exports.approveArtisan = async (req, res) => {
  try {
    const artisan = await User.findOne({
      _id: req.params.id,
      role: 'artisan',
    });

    if (!artisan) {
      return res.status(404).json({
        message: 'Artisan not found',
      });
    }

    if (artisan.artisanStatus === 'approved') {
      return res.status(400).json({
        message: 'Artisan is already approved',
      });
    }

    artisan.artisanStatus = 'approved';

    await artisan.save();

    res.status(200).json({
      message: 'Artisan approved successfully',
      artisan: {
        id: artisan._id,
        name: artisan.name,
        email: artisan.email,
        role: artisan.role,
        artisanStatus: artisan.artisanStatus,
      },
    });
  } catch (err) {
    console.error('Approve artisan error:', err);

    res.status(500).json({
      message: 'Failed to approve artisan',
      error: err.message,
    });
  }
};


// ─────────────────────────────────────────────
// REJECT ARTISAN
// PUT /api/admin/artisans/:id/reject
// ─────────────────────────────────────────────
exports.rejectArtisan = async (req, res) => {
  try {
    const artisan = await User.findOne({
      _id: req.params.id,
      role: 'artisan',
    });

    if (!artisan) {
      return res.status(404).json({
        message: 'Artisan not found',
      });
    }

    if (artisan.artisanStatus === 'rejected') {
      return res.status(400).json({
        message: 'Artisan is already rejected',
      });
    }

    artisan.artisanStatus = 'rejected';

    await artisan.save();

    res.status(200).json({
      message: 'Artisan rejected successfully',
      artisan: {
        id: artisan._id,
        name: artisan.name,
        email: artisan.email,
        role: artisan.role,
        artisanStatus: artisan.artisanStatus,
      },
    });
  } catch (err) {
    console.error('Reject artisan error:', err);

    res.status(500).json({
      message: 'Failed to reject artisan',
      error: err.message,
    });
  }
};