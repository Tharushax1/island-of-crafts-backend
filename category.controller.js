const { Category } = require('./models');

// helper: turn "Batik Textiles" into "batik-textiles"
const toSlug = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─────────────────────────────────────────────
// CREATE — POST /api/categories  (admin only)
// ─────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const slug = toSlug(name);
    const exists = await Category.findOne({ slug });
    if (exists) return res.status(400).json({ message: 'Category already exists' });

    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) return res.status(400).json({ message: 'Invalid parentCategory' });
    }

    const category = await Category.create({ name, slug, description, parentCategory: parentCategory || null });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
};

// ─────────────────────────────────────────────
// READ ALL — GET /api/categories
// Returns a flat list; frontend nests them by parentCategory if needed
// ─────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory', 'name slug');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE — PUT /api/categories/:id  (admin only)
// ─────────────────────────────────────────────
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (req.body.name) {
      category.name = req.body.name;
      category.slug = toSlug(req.body.name);
    }
    if (req.body.description !== undefined) category.description = req.body.description;
    if (req.body.parentCategory !== undefined) category.parentCategory = req.body.parentCategory;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category', error: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE — DELETE /api/categories/:id  (admin only)
// Blocks deletion if products still use this category
// ─────────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  try {
    const { Product } = require('./models');
    const inUse = await Product.exists({ category: req.params.id });
    if (inUse) {
      return res.status(400).json({ message: 'Cannot delete — products still use this category' });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
};
