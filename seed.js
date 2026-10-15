// Run this once with: node seed.js
// Adds sample categories + 10 approved products with placeholder photos,
// so the site has enough content to look and feel like a real store.
require('dotenv').config();
const mongoose = require('mongoose');
const { Category, Product } = require('./models');

const MOCK_ARTISAN_ID = '64f000000000000000000001'; // matches the default mock auth user in auth.middleware.js

const categorySeed = [
  { name: 'Batik Textiles', description: 'Hand-dyed wax-resist fabric art' },
  { name: 'Wood Carving', description: 'Carved wooden art and decor' },
  { name: 'Handwoven Baskets', description: 'Rattan and reed weaving' },
  { name: 'Pottery & Ceramics', description: 'Hand-thrown clay work' },
  { name: 'Brass & Metalwork', description: 'Traditional metal craft' },
  { name: 'Coconut Shell Craft', description: 'Carved and polished coconut shell items' },
];

const productSeed = [
  { name: 'Indigo Batik Wall Hanging', category: 'Batik Textiles', price: 4500, description: 'Hand-dyed indigo batik panel, wax-resist technique, ready to hang.', image: 'https://picsum.photos/seed/batik1/600/450' },
  { name: 'Sunset Batik Sarong', category: 'Batik Textiles', price: 3200, description: 'Lightweight cotton sarong in warm batik dye tones.', image: 'https://picsum.photos/seed/batik2/600/450' },
  { name: 'Carved Elephant Figurine', category: 'Wood Carving', price: 5800, description: 'Hand-carved teak elephant, polished finish, 20cm tall.', image: 'https://picsum.photos/seed/wood1/600/450' },
  { name: 'Peacock Wall Panel', category: 'Wood Carving', price: 7200, description: 'Intricately carved peacock design, traditional Kandyan style.', image: 'https://picsum.photos/seed/wood2/600/450' },
  { name: 'Rattan Storage Basket Set', category: 'Handwoven Baskets', price: 3800, description: 'Set of 3 nested rattan baskets, handwoven finish.', image: 'https://picsum.photos/seed/basket1/600/450' },
  { name: 'Woven Fruit Bowl', category: 'Handwoven Baskets', price: 1800, description: 'Traditional reed-woven bowl for fruit or bread.', image: 'https://picsum.photos/seed/basket2/600/450' },
  { name: 'Glazed Clay Tea Set', category: 'Pottery & Ceramics', price: 6200, description: 'Hand-thrown teapot and 4 cups, blue glaze finish.', image: 'https://picsum.photos/seed/pottery1/600/450' },
  { name: 'Terracotta Planter', category: 'Pottery & Ceramics', price: 2200, description: 'Rustic terracotta planter, hand-finished edges.', image: 'https://picsum.photos/seed/pottery2/600/450' },
  { name: 'Brass Oil Lamp', category: 'Brass & Metalwork', price: 4900, description: 'Traditional Sri Lankan brass oil lamp, hand-polished.', image: 'https://picsum.photos/seed/brass1/600/450' },
  { name: 'Coconut Shell Bowl Set', category: 'Coconut Shell Craft', price: 1500, description: 'Set of 4 polished coconut shell bowls with wooden stand.', image: 'https://picsum.photos/seed/coconut1/600/450' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected — seeding...');

  const categoryMap = {};
  for (const cat of categorySeed) {
    let doc = await Category.findOne({ name: cat.name });
    if (!doc) {
      const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      doc = await Category.create({ ...cat, slug });
      console.log('Created category:', cat.name);
    }
    categoryMap[cat.name] = doc._id;
  }

  for (const p of productSeed) {
    const exists = await Product.findOne({ name: p.name });
    if (exists) {
      console.log('Skipping (already exists):', p.name);
      continue;
    }
    await Product.create({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: Math.floor(Math.random() * 8) + 3,
      category: categoryMap[p.category],
      artisan: MOCK_ARTISAN_ID,
      images: [p.image],
      status: 'approved', // seeded directly as approved, skipping the review workflow
    });
    console.log('Created product:', p.name);
  }

  console.log('Done seeding.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
