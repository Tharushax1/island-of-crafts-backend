const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');
const { protect, requireRole } = require('./auth.middleware');

// Public — needed for filters/dropdowns on the storefront
router.get('/', categoryController.getCategories);

// Admin only — category structure shouldn't be edited by artisans/customers
router.post('/', protect, requireRole('admin'), categoryController.createCategory);
router.put('/:id', protect, requireRole('admin'), categoryController.updateCategory);
router.delete('/:id', protect, requireRole('admin'), categoryController.deleteCategory);

module.exports = router;
