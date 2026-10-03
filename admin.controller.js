const mongoose = require('mongoose');

const {
  Product,
  ArtisanProfile,
  Order,
} = require('./models');

const User = require('./user.model');


// ======================================================
// DASHBOARD STATISTICS
// GET /api/admin/dashboard
// ======================================================

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();

    const pendingProducts = await Product.countDocuments({
      status: 'pending',
    });


    // Artisan users are now managed through User model
    const totalArtisans = await User.countDocuments({
      role: 'artisan',
    });

    const pendingArtisans = await User.countDocuments({
      role: 'artisan',
      artisanStatus: 'pending',
    });


    const totalOrders = await Order.countDocuments();

    const paidOrders = await Order.countDocuments({
      paymentStatus: 'paid',
    });


    const revenueResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: '$total',
          },
        },
      },
    ]);


    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;


    res.status(200).json({
      totalProducts,
      pendingProducts,
      totalArtisans,
      pendingArtisans,
      totalOrders,
      paidOrders,
      totalRevenue,
    });

  } catch (error) {

    console.error(
      'Dashboard stats error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to load dashboard statistics',
      error: error.message,
    });
  }
};


// ======================================================
// GET ALL PENDING ARTISANS
// GET /api/admin/artisans/pending
// ======================================================

exports.getPendingArtisans = async (req, res) => {
  try {

    const artisans = await User.find({
      role: 'artisan',
      artisanStatus: 'pending',
    })
      .select('-password')
      .sort({
        createdAt: -1,
      });


    res.status(200).json({
      count: artisans.length,
      artisans,
    });

  } catch (error) {

    console.error(
      'Get pending artisans error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to fetch pending artisans',
      error: error.message,
    });
  }
};


// ======================================================
// APPROVE ARTISAN
// PUT /api/admin/artisans/:id/approve
// ======================================================

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


    if (
      artisan.artisanStatus === 'approved'
    ) {
      return res.status(400).json({
        message:
          'Artisan is already approved',
      });
    }


    artisan.artisanStatus = 'approved';

    await artisan.save();


    res.status(200).json({
      message:
        'Artisan approved successfully',

      artisan: {
        id: artisan._id,
        name: artisan.name,
        email: artisan.email,
        role: artisan.role,
        artisanStatus:
          artisan.artisanStatus,
      },
    });

  } catch (error) {

    console.error(
      'Approve artisan error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to approve artisan',
      error: error.message,
    });
  }
};


// ======================================================
// REJECT ARTISAN
// PUT /api/admin/artisans/:id/reject
// ======================================================

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


    if (
      artisan.artisanStatus === 'rejected'
    ) {
      return res.status(400).json({
        message:
          'Artisan is already rejected',
      });
    }


    artisan.artisanStatus = 'rejected';

    await artisan.save();


    res.status(200).json({
      message:
        'Artisan rejected successfully',

      artisan: {
        id: artisan._id,
        name: artisan.name,
        email: artisan.email,
        role: artisan.role,
        artisanStatus:
          artisan.artisanStatus,
      },
    });

  } catch (error) {

    console.error(
      'Reject artisan error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to reject artisan',
      error: error.message,
    });
  }
};


// ======================================================
// GET ALL PENDING PRODUCTS
// GET /api/admin/products/pending
// ======================================================

exports.getPendingProducts = async (req, res) => {
  try {

    const products =
      await Product.find({
        status: 'pending',
      })

        .populate(
          'category',
          'name slug'
        )

        .populate(
          'artisan',
          'name'
        )

        .sort({
          createdAt: -1,
        });


    res.status(200).json(
      products
    );

  } catch (error) {

    console.error(
      'Pending products error:',
      error
    );

    res.status(500).json({
      message:
        'Failed to load pending products',
      error: error.message,
    });
  }
};