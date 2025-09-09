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
