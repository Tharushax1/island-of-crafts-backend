// Run this once with: node seedArtisans.js
// Adds 3 more artisan storefronts and reassigns matching seeded products
// to them (by craft specialty), so each storefront has real products.
require('dotenv').config();
const mongoose = require('mongoose');
const { ArtisanProfile, Product, Category } = require('./models');

const artisanSeed = [
  {
    userId: '64f000000000000000000101',
    storeName: 'Amara Batik Studio',
    storeSlug: 'amara-batik-studio',
    bio: 'Third-generation batik dyer working out of a small studio in Galle.',
    story: 'Amara learned wax-resist dyeing from her grandmother and has spent over a decade refining traditional Sri Lankan batik patterns for modern homes.',
    craftSpecialty: 'Batik Textiles',
    location: 'Galle, Sri Lanka',
    matchCategory: 'Batik Textiles',
  },
  {
    userId: '64f000000000000000000102',
    storeName: "Ranjan's Clay & Co",
    storeSlug: 'ranjans-clay-co',
    bio: 'Hand-thrown pottery inspired by ancient Anuradhapura ceramic traditions.',
    story: 'Ranjan trained under a master potter near the ancient city of Anuradhapura, and now runs a small kiln workshop producing functional, glazed ceramics.',
    craftSpecialty: 'Pottery & Ceramics',
    location: 'Anuradhapura, Sri Lanka',
    matchCategory: 'Pottery & Ceramics',
  },
  {
    userId: '64f000000000000000000103',
    storeName: 'Lakshan Basket Weaves',
    storeSlug: 'lakshan-basket-weaves',
    bio: 'Reed and rattan weaving from a coastal fishing village near Negombo.',
    story: "Lakshan's family has woven fishing baskets for generations — he now applies the same techniques to homeware, blending function with craft.",
    craftSpecialty: 'Handwoven Baskets',
    location: 'Negombo, Sri Lanka',
    matchCategory: 'Handwoven Baskets',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected — seeding artisans...');

  for (const a of artisanSeed) {
    let profile = await ArtisanProfile.findOne({ storeSlug: a.storeSlug });
    if (!profile) {
      profile = await ArtisanProfile.create({
        user: a.userId,
        storeName: a.storeName,
        storeSlug: a.storeSlug,
        bio: a.bio,
        story: a.story,
        craftSpecialty: a.craftSpecialty,
        location: a.location,
      });
      console.log('Created artisan:', a.storeName);
    } else {
      console.log('Skipping (already exists):', a.storeName);
    }

    // Reassign matching products to this artisan so their storefront isn't empty
    const category = await Category.findOne({ name: a.matchCategory });
    if (category) {
      const result = await Product.updateMany(
        { category: category._id },
        { $set: { artisan: a.userId } }
      );
      console.log(`  Linked ${result.modifiedCount} "${a.matchCategory}" product(s) to ${a.storeName}`);
    }
  }

  console.log('Done seeding artisans.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
