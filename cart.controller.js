const { Cart, Product } = require('./models');

// ─────────────────────────────────────────────
// GET CART — GET /api/cart
// Returns the logged-in customer's cart
// ─────────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price stock images artisan category',
        populate: [
          {
            path: 'artisan',
            select: 'name',
          },
          {
            path: 'category',
            select: 'name slug',
          },
        ],
      })
      .populate('items.artisan', 'name');

    if (!cart) {
      return res.json({
        customer: req.user._id,
        items: [],
      });
    }

    res.json(cart);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch cart',
      error: err.message,
    });
  }
};


// ─────────────────────────────────────────────
// ADD TO CART — POST /api/cart
// Body: { productId, quantity }
// ─────────────────────────────────────────────
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: 'productId is required',
      });
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        message: 'quantity must be a positive whole number',
      });
    }

    // Find approved product
    const product = await Product.findOne({
      _id: productId,
      status: 'approved',
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found or not available',
      });
    }

    // Check stock
    if (product.stock < requestedQuantity) {
      return res.status(400).json({
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    // Find customer's cart
    let cart = await Cart.findOne({
      customer: req.user._id,
    });

    // Create cart if customer doesn't have one
    if (!cart) {
      cart = await Cart.create({
        customer: req.user._id,
        items: [
          {
            product: product._id,
            artisan: product.artisan,
            quantity: requestedQuantity,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === product._id.toString()
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + requestedQuantity;

        if (newQuantity > product.stock) {
          return res.status(400).json({
            message: `Only ${product.stock} item(s) available in stock`,
          });
        }

        existingItem.quantity = newQuantity;
      } else {
        cart.items.push({
          product: product._id,
          artisan: product.artisan,
          quantity: requestedQuantity,
        });
      }

      await cart.save();
    }

    // Return updated cart
    const updatedCart = await Cart.findOne({
      customer: req.user._id,
    }).populate({
      path: 'items.product',
      select: 'name price stock images artisan category',
      populate: [
        {
          path: 'artisan',
          select: 'name',
        },
        {
          path: 'category',
          select: 'name slug',
        },
      ],
    });

    res.status(201).json(updatedCart);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to add product to cart',
      error: err.message,
    });
  }
};


// ─────────────────────────────────────────────
// UPDATE CART ITEM — PUT /api/cart/:productId
// Body: { quantity }
// ─────────────────────────────────────────────
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const requestedQuantity = Number(req.body.quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        message: 'quantity must be a positive whole number',
      });
    }

    const product = await Product.findOne({
      _id: productId,
      status: 'approved',
    });

    if (!product) {
      return res.status(404).json({
        message: 'Product not found or not available',
      });
    }

    if (requestedQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} item(s) available in stock`,
      });
    }

    const cart = await Cart.findOne({
      customer: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: 'Cart not found',
      });
    }

    const item = cart.items.find(
      (cartItem) => cartItem.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: 'Product is not in your cart',
      });
    }

    item.quantity = requestedQuantity;

    await cart.save();

    const updatedCart = await Cart.findOne({
      customer: req.user._id,
    }).populate({
      path: 'items.product',
      select: 'name price stock images artisan category',
      populate: [
        {
          path: 'artisan',
          select: 'name',
        },
        {
          path: 'category',
          select: 'name slug',
        },
      ],
    });

    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to update cart item',
      error: err.message,
    });
  }
};


// ─────────────────────────────────────────────
// REMOVE FROM CART — DELETE /api/cart/:productId
// ─────────────────────────────────────────────
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({
      customer: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: 'Cart not found',
      });
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        message: 'Product is not in your cart',
      });
    }

    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to remove product from cart',
      error: err.message,
    });
  }
};


// ─────────────────────────────────────────────
// CLEAR CART — DELETE /api/cart
// ─────────────────────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      customer: req.user._id,
    });

    if (!cart) {
      return res.json({
        message: 'Cart is already empty',
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      message: 'Cart cleared successfully',
      cart,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to clear cart',
      error: err.message,
    });
  }
};