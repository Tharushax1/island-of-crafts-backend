// // TEMPORARY MOCK — replace with Hasandi's real auth.middleware.js once ready.
// // Same function names/signatures so swapping later needs zero changes elsewhere.

// // Simulates a logged-in user. For testing, change the role/_id below,
// // or pass a header like `x-mock-role: artisan` when testing in Postman.
// exports.protect = (req, res, next) => {
//   req.user = {
//     _id: req.headers['x-mock-userid'] || '64f000000000000000000001',
//     role: req.headers['x-mock-role'] || 'artisan',
//     name: 'Test Artisan',
//   };
//   next();
// };

// exports.requireRole = (role) => (req, res, next) => {
//   if (!req.user || req.user.role !== role) {
//     return res.status(403).json({ message: `Requires ${role} role` });
//   }
//   next();
// };

//Hasandi's original work

const jwt = require('jsonwebtoken');
const User = require('./user.model');

// ─────────────────────────────────────────────
// PROTECT ROUTES
// Checks whether the request contains a valid JWT
// ─────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];

    // 3. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 4. Find user from database
    const user = await User.findById(decoded.userId).select(
      '-password'
    );

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
      });
    }

    // 5. Check whether account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Your account is inactive',
      });
    }

    // 6. Attach authenticated user to request
    req.user = user;

    next();

  } catch (err) {
    console.error('Authentication error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token has expired',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token',
      });
    }

    return res.status(401).json({
      message: 'Authentication failed',
    });
  }
};


// ─────────────────────────────────────────────
// ROLE-BASED ACCESS CONTROL
// ─────────────────────────────────────────────
exports.requireRole = (role) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        message: `Requires ${role} role`,
      });
    }

    next();
  };
};

// ─────────────────────────────────────────────
// VERIFIED ARTISAN ACCESS
// Allows only approved artisans
// ─────────────────────────────────────────────
exports.requireVerifiedArtisan = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'artisan') {
    return res.status(403).json({
      message: 'Requires artisan role',
    });
  }

  if (req.user.artisanStatus !== 'approved') {
    return res.status(403).json({
      message: 'Artisan account is not verified',
      status: req.user.artisanStatus,
    });
  }

  next();
};