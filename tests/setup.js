import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });
dotenv.config();

let mongoServer;

// Global setup before all tests
global.beforeAll = async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

// Global cleanup after all tests
global.afterAll = async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Setup before each test
global.beforeEach = async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

// Suppress console logs during tests unless needed
if (process.env.NODE_ENV === 'test' && !process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Global test utilities
global.testUtils = {
  generateValidObjectId: () => new mongoose.Types.ObjectId().toString(),
  
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'revisor',
    ...overrides
  }),
  
  createTestProcess: (overrides = {}) => ({
    name: 'Test Process',
    description: 'Test process description',
    ...overrides
  }),
  
  createTestIncident: (processId, createdBy, overrides = {}) => ({
    processId,
    description: 'Test incident description',
    createdBy,
    status: 'pendiente',
    evidence: [],
    ...overrides
  })
};

// Mock external services
jest.mock('../src/config/cloudinary.js', () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue('https://mock-cloudinary-url.com/image.jpg')
}));

jest.mock('../src/services/websocketService.js', () => ({
  emitToRoles: jest.fn(),
  emitToUser: jest.fn(),
  emitToAll: jest.fn()
}));