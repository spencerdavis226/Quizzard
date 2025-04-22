import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server';
import { createTestUser } from './testUtils';

// Mock the database configuration to prevent actual database connections during tests
jest.mock('../config/db', () => ({
  connectDB: jest.fn(),
  disconnectDB: jest.fn(),
}));

// Declare a variable to hold the in-memory MongoDB server instance
let mongoServer: MongoMemoryServer;

// Set up an in-memory MongoDB server and connect to it before running tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  await createTestUser(); // Create a test user in the in-memory database
});

// Clean up the in-memory MongoDB server and disconnect Mongoose after all tests
afterAll(async () => {
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
});

// Tests for the authentication endpoints (login and register)
describe('POST /api/auth/login', () => {
  // Test valid login credentials
  it('should return 200 and a token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  // Test invalid login credentials
  it('should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });
});

// Tests for the registration endpoint
describe('POST /api/auth/register', () => {
  // Test successful user registration
  it('should register a new user', async () => {
    const response = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      'message',
      'User registered successfully'
    );
  });

  // Test duplicate email registration
  it('should return 400 for duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'duplicateuser',
      email: 'test@example.com', // Duplicate email
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/register').send({
      username: 'anotheruser',
      email: 'test@example.com', // Duplicate email
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Email already in use');
  });

  // Test duplicate username registration
  it('should return 400 for duplicate username', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'testuser', // Duplicate username
      email: 'unique@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/api/auth/register').send({
      username: 'testuser', // Duplicate username
      email: 'anotherunique@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Username already in use');
  });
});
