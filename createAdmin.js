const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./user.model');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');

    // Check whether an admin already exists
    const existingAdmin = await User.findOne({
      role: 'admin',
    });

    if (existingAdmin) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Admin credentials
    const name = 'Island of Crafts Admin';
    const email = 'admin@islandofcrafts.lk';
    const password = 'Admin@12345';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      artisanStatus: null,
      isActive: true,
    });

    console.log('Admin account created successfully');
    console.log('Email:', admin.email);

    process.exit(0);

  } catch (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }
};

createAdmin();