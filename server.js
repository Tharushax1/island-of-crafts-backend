require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const artisanProfileRoutes = require('./artisanProfile.routes');
const customRequestRoutes = require('./customRequest.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');

// Register User model
require('./user.model');

const app = express();


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// ======================================================
// ROUTES
// ======================================================

// Authentication
app.use(
  '/api/auth',
  authRoutes
);

// Products
app.use(
  '/api/products',
  productRoutes
);

// Categories
app.use(
  '/api/categories',
  categoryRoutes
);

// Artisan profile / storefront
app.use(
  '/api',
  artisanProfileRoutes
);

// Custom requests
app.use(
  '/api/custom-requests',
  customRequestRoutes
);

// Cart
app.use(
  '/api/cart',
  cartRoutes
);

// Orders / Payments
app.use(
  '/api/orders',
  orderRoutes
);

// Admin
app.use(
  '/api/admin',
  adminRoutes
);


// ======================================================
// API STATUS
// ======================================================

app.get('/', (req, res) => {
  res.json({
    status: 'Island of Crafts API running',
  });
});


// ======================================================
// SERVER + DATABASE
// ======================================================

const PORT =
  process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {

    console.log(
      'MongoDB connected'
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Server running on port ${PORT}`
        );
      }
    );

  })

  .catch((err) => {

    console.error(
      'MongoDB connection failed:',
      err.message
    );

  });


module.exports = app;