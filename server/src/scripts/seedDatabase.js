const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { seedDepartmentsAndStaff } = require('../utils/seedData');

const runSeed = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resolvedesk';

    console.log('[Seed Script] Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('[Seed Script] Connected successfully.');

    await seedDepartmentsAndStaff();
    console.log('[Seed Script] Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Script Error]:', err.message);
    process.exit(1);
  }
};

runSeed();
