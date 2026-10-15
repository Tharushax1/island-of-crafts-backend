const { Product, Category } = require('./models');

// ─────────────────────────────────────────────
// CREATE — POST /api/products
// ─────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, attributes, images } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({ message: 'name, description, price and category are required' });
    }
    if (price < 0) {
      return res.status(400).json({ message: 'price must be a positive number' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      attributes,
      images,
      artisan: req.user._id, // comes from Hasandi's auth middleware
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
};

// ─────────────────────────────────────────────
// READ ALL — GET /api/products?category=&search=
// ─────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const { category, search, artisan } = req.query;
    const filter = { status: 'approved' };

    if (category) filter.category = category;
    if (artisan) filter.artisan = artisan;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('artisan', 'name');

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

// ─────────────────────────────────────────────
// READ ONE — GET /api/products/:id
// ─────────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('artisan', 'name');

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE — PUT /api/products/:id
// ─────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // only the owning artisan can edit their own product
    if (product.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    if (req.body.price !== undefined && req.body.price < 0) {
      return res.status(400).json({ message: 'price must be a positive number' });
    }

    Object.assign(product, req.body);
    // any edit sends it back for re-approval
    product.status = 'pending';
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};

// ─────────────────────────────────────────────
// APPROVE / REJECT — PUT /api/products/:id/approve   (admin only)
// Separate from updateProduct — this is how Janapriya's admin
// dashboard moves a product from 'pending' to 'approved'/'rejected'.
// ─────────────────────────────────────────────
exports.approveProduct = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.status = status;
    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product status', error: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE — DELETE /api/products/:id
// ─────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};
