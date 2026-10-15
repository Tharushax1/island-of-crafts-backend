// Run this once with: node updateImages.js
// Replaces the random Picsum placeholder photos with real, free
// (non-watermarked, commercial-use-ok) Unsplash photos that actually
// match each product's craft type.
require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('./models');

const updates = [
  { name: 'Indigo Batik Wall Hanging', image: 'https://images.unsplash.com/photo-1616125162686-770bf85622b9?w=800&auto=format&fit=crop&q=80' },
  { name: 'Sunset Batik Sarong', image: 'https://images.unsplash.com/photo-1761517099330-13b34b141d74?w=800&auto=format&fit=crop&q=80' },
  { name: 'Carved Elephant Figurine', image: 'https://images.unsplash.com/photo-1497219055242-93359eeed651?w=800&auto=format&fit=crop&q=80' },
  { name: 'Peacock Wall Panel', image: 'https://images.unsplash.com/photo-1497218770144-3fea6dbc33fe?w=800&auto=format&fit=crop&q=80' },
  { name: 'Rattan Storage Basket Set', image: 'https://images.unsplash.com/photo-1455669175216-9017c9b02fc6?w=800&auto=format&fit=crop&q=80' },
  { name: 'Woven Fruit Bowl', image: 'https://images.unsplash.com/photo-1601330862030-1e08c703ac04?w=800&auto=format&fit=crop&q=80' },
  { name: 'Glazed Clay Tea Set', image: 'https://images.unsplash.com/photo-1597696929736-6d13bed8e6a8?w=800&auto=format&fit=crop&q=80' },
  { name: 'Terracotta Planter', image: 'https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=800&auto=format&fit=crop&q=80' },
  // Brass Oil Lamp and Coconut Shell Bowl Set intentionally left out —
  // no good real photo match found yet. They'll keep showing the
  // colorful pattern fallback until a real photo is added.
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected — updating images...');

  for (const u of updates) {
    const result = await Product.updateOne({ name: u.name }, { $set: { images: [u.image] } });
    console.log(result.matchedCount ? `Updated: ${u.name}` : `Not found: ${u.name}`);
  }

  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Update failed:', err.message);
  process.exit(1);
});
