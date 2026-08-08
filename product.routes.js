const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { protect, requireRole } = require('./auth.middleware'); // Hasandi's module

// Public — anyone can browse products
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Protected — only logged-in artisans can create/edit/delete their own products
router.post('/', protect, requireRole('artisan'), productController.createProduct);
router.put('/:id', protect, requireRole('artisan'), productController.updateProduct);
router.put('/:id/approve', protect, requireRole('admin'), productController.approveProduct);
router.delete('/:id', protect, requireRole('artisan'), productController.deleteProduct);

module.exports = router;
