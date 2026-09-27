const mongoose = require('mongoose');
const { Cart, Product, Order } = require('./models');

const FREE_DELIVERY_LIMIT = 20000;
const DELIVERY_FEE = 350;

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `IOC-${timestamp}-${random}`;
}

// POST /api/orders
// Creates an order from the customer's server-side cart.
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      email = '',
      shippingAddress,
      paymentMethod = 'cash_on_delivery',
    } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        message: 'Delivery address is required',
      });
    }

    const requiredFields = [
      'fullName',
      'phone',
      'address',
      'city',
      'postalCode',
    ];

    for (const field of requiredFields) {
      if (!String(shippingAddress[field] || '').trim()) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }

    if (paymentMethod !== 'cash_on_delivery') {
      return res.status(400).json({
        message: 'Selected payment method is not available',
      });
    }

    const cart = await Cart.findOne({
      customer: req.user._id,
    }).session(session).populate({
      path: 'items.product',
      select: 'name price stock artisan status images',
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: 'Your cart is empty',
      });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      if (!product || product.status !== 'approved') {
        return res.status(400).json({
          message: 'One of the products in your cart is no longer available',
        });
      }

      const quantity = Number(cartItem.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          message: `Invalid quantity for ${product.name}`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Only ${product.stock} item(s) of "${product.name}" are available`,
        });
      }

      const price = Number(product.price);
      const itemSubtotal = price * quantity;

      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        artisan: product.artisan,
        productName: product.name,
        price,
        quantity,
        subtotal: itemSubtotal,
      });
    }

    const deliveryFee =
      subtotal >= FREE_DELIVERY_LIMIT
        ? 0
        : DELIVERY_FEE;

    const total = subtotal + deliveryFee;

    let createdOrder;

    await session.withTransaction(async () => {
      // Re-check and decrement stock atomically for each product.
      for (const item of orderItems) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.product,
            status: 'approved',
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw new Error(
            `Stock changed for "${item.productName}". Please review your cart and try again.`
          );
        }
      }

      const [order] = await Order.create(
        [
          {
            customer: req.user._id,
            orderNumber: generateOrderNumber(),
            items: orderItems,
            shippingAddress: {
              fullName: String(shippingAddress.fullName).trim(),
              phone: String(shippingAddress.phone).trim(),
              address: String(shippingAddress.address).trim(),
              city: String(shippingAddress.city).trim(),
              postalCode: String(shippingAddress.postalCode).trim(),
            },
            customerEmail: String(email).trim().toLowerCase(),
            subtotal,
            deliveryFee,
            total,
            paymentMethod,
            paymentStatus: 'pending',
            status: 'confirmed',
          },
        ],
        { session }
      );

      await Cart.updateOne(
        { _id: cart._id },
        { $set: { items: [] } },
        { session }
      );

      createdOrder = order;
    });

    res.status(201).json({
      success: true,
      order: {
        id: createdOrder._id,
        orderNumber: createdOrder.orderNumber,
        subtotal: createdOrder.subtotal,
        deliveryFee: createdOrder.deliveryFee,
        total: createdOrder.total,
        paymentMethod: createdOrder.paymentMethod,
        paymentStatus: createdOrder.paymentStatus,
        status: createdOrder.status,
      },
    });
  } catch (err) {
    console.error('Create order error:', err);

    const message = err.message?.includes('Stock changed')
      ? err.message
      : 'Failed to create order';

    res.status(500).json({
      message,
      error: err.message,
    });
  } finally {
    await session.endSession();
  }
};

// GET /api/orders/:orderNumber
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
      customer: req.user._id,
    }).populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch order',
      error: err.message,
    });
  }
};
