import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User, { IUser } from '../models/User';
import { validToken, createTestUser } from './testUtils';

// Mock database connection
jest.mock('../config/db', () => ({
  connectDB: jest.fn(),
  disconnectDB: jest.fn(),
}));

let mongoServer: MongoMemoryServer;
let testUser: IUser;
let testFriend: IUser;

// Setup test environment
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Reset test data before each test
beforeEach(async () => {
  await User.deleteMany({});
  const { testUser: user, testFriend: friend } = await createTestUser();
  testUser = user;
  testFriend = friend;
});

// Core profile functionality tests
describe('User Profile Management', () => {
  // Authentication check
  it('requires authentication for user profile endpoints', async () => {
    const response = await request(app).get('/api/user/me');
    expect(response.status).toBe(401);
  });

  // Retrieve profile
  it('retrieves the user profile when authenticated', async () => {
    const response = await request(app)
      .get('/api/user/me')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', testUser.username);
    expect(response.body).toHaveProperty('email', testUser.email);
  });

  // Update profile
  it('updates the user profile successfully', async () => {
    const response = await request(app)
      .put('/api/user/me')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: 'updateduser' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'updateduser');
  });
});

// Core friend functionality tests
describe('Friend Management', () => {
  // Add friend
  it("adds a friend to user's friend list", async () => {
    const response = await request(app)
      .post('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: testFriend.username });

    expect(response.status).toBe(200);
    expect(response.body.user.friends).toContainEqual(
      testFriend._id.toString()
    );
  });

  // Remove friend
  it("removes a friend from user's friend list", async () => {
    // First add the friend
    await request(app)
      .post('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: testFriend.username });

    // Then remove the friend
    const response = await request(app)
      .delete('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: testFriend.username });

    expect(response.status).toBe(200);
    expect(response.body.user.friends).not.toContainEqual(
      testFriend._id.toString()
    );
  });

  // Fetch friends list
  it("fetches the user's friends list", async () => {
    // Add friend to user's friends list directly
    testUser.friends.push(testFriend._id);
    await testUser.save();

    const response = await request(app)
      .get('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.friends)).toBe(true);
    expect(response.body.friends[0]._id).toBe(testFriend._id.toString());
  });
});

// Game stats tests
describe('User Game Stats', () => {
  // Get stats
  it("fetches the user's game stats", async () => {
    // Set some stats first
    testUser.mana = 50;
    testUser.mageMeter = 75;
    await testUser.save();

    // No need for authorization header since this endpoint doesn't require it
    const response = await request(app).get(`/api/user/stats/${testUser._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('mana', 50);
    expect(response.body).toHaveProperty('mageMeter', 75);
  });
});
