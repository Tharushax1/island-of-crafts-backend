const mongoose = require('mongoose');
const { Product, ArtisanProfile, Order } = require('./models');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const pendingProducts = await Product.countDocuments({ status: 'pending' });

    const totalArtisans = await ArtisanProfile.countDocuments();
    const pendingArtisans = await ArtisanProfile.countDocuments({ verified: false });

    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ paymentStatus: 'paid' });

    const revenueResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      totalProducts,
      pendingProducts,
      totalArtisans,
      pendingArtisans,
      totalOrders,
      paidOrders,
      totalRevenue
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      message: 'Failed to load dashboard statistics'
    });
  }
};

// Get all pending artisans
exports.getPendingArtisans = async (req, res) => {
  try {
    const artisans = await ArtisanProfile
      .find({ verified: false })
      .sort({ createdAt: -1 });

    res.json(artisans);
  } catch (error) {
    console.error('Pending artisans error:', error);

    res.status(500).json({
      message: 'Failed to load pending artisans'
    });
  }
};


// Approve artisan
exports.approveArtisan = async (req, res) => {
  try {
    const artisan = await ArtisanProfile.findById(req.params.id);

    if (!artisan) {
      return res.status(404).json({
        message: 'Artisan not found'
      });
    }

    artisan.verified = true;
    await artisan.save();

    res.json({
      message: 'Artisan approved successfully',
      artisan
    });

  } catch (error) {
    console.error('Approve artisan error:', error);

    res.status(500).json({
      message: 'Failed to approve artisan'
    });
  }
};

exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'pending' })
      .populate('category', 'name slug')
      .populate('artisan', 'name')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Pending products error:', error);

    res.status(500).json({
      message: 'Failed to load pending products'
    });
  }
};