const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─────────────────────────────────────────────
// 0. TEMPORARY PLACEHOLDER USER MODEL
// Remove this once Hasandi's real User model (Auth & User/Vendor
// Management module) is merged in — this exists only so that
// .populate('user'/'artisan'/'customer') doesn't crash for now.
// ─────────────────────────────────────────────
const userSchema = new Schema({
  name: { type: String, default: 'Test User' },
  role: { type: String, default: 'artisan' },
}, { timestamps: true });

if (!mongoose.models.User) {
  mongoose.model('User', userSchema);
}

// ─────────────────────────────────────────────
// 1. CATEGORY
// ─────────────────────────────────────────────
const categorySchema = new Schema({
  name: { type: String, required: true, unique: true },       // e.g. "Batik Textiles"
  slug: { type: String, required: true, unique: true },        // e.g. "batik-textiles"
  description: { type: String },
  parentCategory: { type: Schema.Types.ObjectId, ref: 'Category', default: null }, // for nested categories
}, { timestamps: true });

// ─────────────────────────────────────────────
// 2. PRODUCT
// ─────────────────────────────────────────────
const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 1 },

  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  artisan: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // owner artisan

  images: [{ type: String }], // Cloudinary/S3 URLs

  // flexible fields per category — e.g. { color: "Indigo", fabric: "Cotton" } for batik,
  // { woodType: "Teak", finish: "Matte" } for wood carving
  attributes: { type: Schema.Types.Mixed, default: {} },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending', // admin approval workflow (slide 8)
  },
}, { timestamps: true });

// ─────────────────────────────────────────────
// 3. ARTISAN PROFILE (storefront + storytelling)
// ─────────────────────────────────────────────
const artisanProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  storeName: { type: String, required: true },
  storeSlug: { type: String, required: true, unique: true }, // for public URL: /store/:storeSlug

  bio: { type: String },                // short intro
  story: { type: String },              // long-form storytelling content
  craftSpecialty: { type: String },     // e.g. "Handloom weaving"
  location: { type: String },           // e.g. "Kandy, Sri Lanka"

  profileImage: { type: String },
  coverImage: { type: String },
  galleryImages: [{ type: String }],    // behind-the-scenes / process photos

  verified: { type: Boolean, default: false }, // set true by admin approval
}, { timestamps: true });

// ─────────────────────────────────────────────
// 4. CUSTOM REQUEST → QUOTATION → ORDER WORKFLOW
// ─────────────────────────────────────────────
const customRequestSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  artisan: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  description: { type: String, required: true }, // what the customer wants made
  referenceImages: [{ type: String }],
  budgetRange: { type: String }, // optional, e.g. "LKR 5000-10000"

  status: {
    type: String,
    enum: ['pending', 'quoted', 'accepted', 'rejected', 'converted'],
    default: 'pending',
  },

  // filled in by the artisan when they respond
  quotation: {
    price: { type: Number },
    estimatedDays: { type: Number },
    message: { type: String },
    quotedAt: { type: Date },
  },

  // set once the customer accepts and it becomes a real order
  convertedOrder: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
}, { timestamps: true });

// ─────────────────────────────────────────────
// 5. CART
// One cart per customer
// Supports products from multiple artisans
// ─────────────────────────────────────────────
const cartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  artisan: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: true });

const cartSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  items: [cartItemSchema],

}, { timestamps: true });


// ─────────────────────────────────────────────
// 6. ORDER
// One checkout creates one order.
// The order can contain products from multiple artisans.
// ─────────────────────────────────────────────
const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  artisan: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  productName: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },

}, { _id: true });


const orderSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },

  items: {
    type: [orderItemSchema],
    validate: {
      validator: (items) => items.length > 0,
      message: 'Order must contain at least one item',
    },
  },

  shippingAddress: {
    fullName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    postalCode: {
      type: String,
      required: true,
    },
  },

  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },

  deliveryFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },

  total: {
    type: Number,
    required: true,
    min: 0,
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },

  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ],
    default: 'pending',
  },

  customRequest: {
    type: Schema.Types.ObjectId,
    ref: 'CustomRequest',
    default: null,
  },

}, { timestamps: true });

module.exports = {
  Category: mongoose.model('Category', categorySchema),
  Product: mongoose.model('Product', productSchema),
  ArtisanProfile: mongoose.model('ArtisanProfile', artisanProfileSchema),
  CustomRequest: mongoose.model('CustomRequest', customRequestSchema),
   Cart: mongoose.model('Cart', cartSchema),
  Order: mongoose.model('Order', orderSchema),
};
