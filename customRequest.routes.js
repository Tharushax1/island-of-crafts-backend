const express = require('express');
const router = express.Router();
const customRequestController = require('./customRequest.controller');
const { protect, requireRole } = require('./auth.middleware');

router.post('/', protect, requireRole('customer'), customRequestController.createRequest);
router.get('/', protect, customRequestController.getMyRequests); // works for both roles

router.put('/:id/quote', protect, requireRole('artisan'), customRequestController.quoteRequest);
router.put('/:id/respond', protect, requireRole('customer'), customRequestController.respondToQuote);
router.post('/:id/convert', protect, requireRole('customer'), customRequestController.convertToOrder);

module.exports = router;
