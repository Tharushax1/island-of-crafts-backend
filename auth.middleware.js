// TEMPORARY MOCK — replace with Hasandi's real auth.middleware.js once ready.
// Same function names/signatures so swapping later needs zero changes elsewhere.

// Simulates a logged-in user. For testing, change the role/_id below,
// or pass a header like `x-mock-role: artisan` when testing in Postman.
exports.protect = (req, res, next) => {
  req.user = {
    _id: req.headers['x-mock-userid'] || '64f000000000000000000001',
    role: req.headers['x-mock-role'] || 'artisan',
    name: 'Test Artisan',
  };
  next();
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: `Requires ${role} role` });
  }
  next();
};
