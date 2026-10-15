const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user.model');

// ─────────────────────────────────────────────
// REGISTER USER
// POST /api/auth/register
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required',
      });
    }

    // 2. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    // 3. Check whether email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists',
      });
    }

    // 4. Validate role
    const allowedRoles = ['customer', 'artisan'];

    const selectedRole = role || 'customer';

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        message: 'Invalid registration role',
      });
    }

    // 5. Hash password using Bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Set artisan verification status
    const artisanStatus =
      selectedRole === 'artisan' ? 'pending' : null;

    // 7. Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: selectedRole,
      artisanStatus,
    });

    // 8. Never send password back to the client
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      artisanStatus: user.artisanStatus,
      isActive: user.isActive,
    };

    // 9. Return successful response
    return res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
    });
  } catch (err) {
    console.error('Registration error:', err);

    return res.status(500).json({
      message: 'Registration failed',
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────
// LOGIN USER
// POST /api/auth/login
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // 2. Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // 3. Check whether account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Your account is inactive',
      });
    }

    // 4. Compare entered password with Bcrypt hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // 5. Create JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    // 6. User information returned to frontend
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      artisanStatus: user.artisanStatus,
      isActive: user.isActive,
    };

    // 7. Return token and user
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse,
    });

  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      message: 'Login failed',
      error: err.message,
    });
  }
};