import seedDatabase from './fullSeeder.js';

// This is just a wrapper around the full seeder that checks if data exists
// before creating it. This is used for initial bootstrapping when server starts.
const seedInitialData = async () => {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Error seeding initial data:', error);
    throw error;
  }
};

export default seedInitialData;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const connectDB = await import('../config/database.js');
  await connectDB.default();
  await seedInitialData();
  process.exit(0);
}
