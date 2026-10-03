const express = require('express');

const router = express.Router();

const authController = require('./auth.controller');

// User registration
router.post('/register', authController.register);
//User Login
router.post('/login', authController.login);

module.exports = router;