require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./auth.routes'); //Connect the route to server.js

const adminRoutes = require('./admin.routes'); // Connect the admin route to server.js

require('./user.model'); //user model (hasandi)

const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const artisanProfileRoutes = require('./artisanProfile.routes');
const customRequestRoutes = require('./customRequest.routes');

const app = express();
app.use(cors()); // allows the React frontend (localhost:5173) to call this API
app.use(express.json());

// ─── Routes ───
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api', artisanProfileRoutes);        // /api/artisan-profile, /api/storefront/:slug
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/auth', authRoutes);  //adding route and now the endpoint becomes POST http://localhost:5000/api/auth/register
app.use('/api/admin', adminRoutes); //admin route

app.get('/', (req, res) => res.json({ status: 'Island of Crafts API running' }));

const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB Atlas, then start the server ───
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));

module.exports = app;
