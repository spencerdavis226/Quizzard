import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User, { IUser } from '../models/User';
import { validToken, createTestUser } from './testUtils';

// Mock database connection to prevent real DB calls during tests
jest.mock('../config/db', () => ({
  connectDB: jest.fn(),
  disconnectDB: jest.fn(),
}));

let mongoServer: MongoMemoryServer;
let testUser: IUser;
let testFriend: IUser;

// Set up an in-memory MongoDB server and connect to it before running tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Clean up the in-memory MongoDB server and disconnect Mongoose after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear the database before each test
  await User.deleteMany({});

  // Create a test user and a test friend
  const { testUser: createdTestUser, testFriend: createdTestFriend } =
    await createTestUser();
  testUser = createdTestUser;
  testFriend = createdTestFriend;
});

// Test to ensure unauthenticated users cannot access user profile
// This checks if the API returns a 401 Unauthorized error when no token is provided
describe('GET /api/user', () => {
  it('should return 401 if not authenticated', async () => {
    const response = await request(app).get('/api/user/me');
    expect(response.status).toBe(401);
  });
});

// Tests for user-related API endpoints, such as retrieving and updating user profiles
describe('User Endpoints', () => {
  // Test to retrieve the user profile when authenticated
  it('should retrieve the user profile', async () => {
    const response = await request(app)
      .get('/api/user/me')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', testUser.username);
  });

  // Test to update the user profile with new data
  it('should update the user profile', async () => {
    const response = await request(app)
      .put('/api/user/me')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: 'updateduser' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'updateduser');
  });

  // Test to add a friend to the user's friend list
  it('should add a friend', async () => {
    const response = await request(app)
      .post('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: testFriend.username });
    expect(response.status).toBe(200);
    expect(response.body.user.friends).toContainEqual(
      testFriend._id.toString()
    );
  });

  // Test to remove a friend from the user's friend list
  it('should remove a friend', async () => {
    // Add the friend first
    await request(app)
      .post('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: testFriend.username });

    // Now remove the friend
    const response = await request(app)
      .delete('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: testFriend.username });
    expect(response.status).toBe(200);
    expect(response.body.user.friends).not.toContainEqual(
      testFriend._id.toString()
    );
  });
});

// Tests for edge cases in friend management, such as adding or removing non-existent users
describe('Friend management edge cases', () => {
  // Test to ensure adding a non-existent user as a friend returns a 404 error
  it('should return 404 when adding a non-existent user as a friend', async () => {
    const response = await request(app)
      .post('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: 'ghostuser' });
    expect(response.status).toBe(404);
  });

  // Test to ensure removing a non-existent user as a friend returns a 404 error
  it('should return 404 when removing a non-existent user as a friend', async () => {
    const response = await request(app)
      .delete('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: 'ghostuser' });
    expect(response.status).toBe(404);
  });
});

// Tests for deleting the user account
describe('DELETE /api/user/me', () => {
  // Test to ensure the user account is deleted successfully
  it('should delete the user account', async () => {
    const response = await request(app)
      .delete('/api/user/me')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Account deleted successfully'
    );
  });
});

// Tests for fetching the user's friends list
describe('GET /api/user/friends', () => {
  // Test to ensure the friends list is fetched correctly
  it('should fetch the friends list', async () => {
    // Add the friend to the user's friends list
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

// Tests for protecting user stats endpoints from unauthenticated access
describe('User stats protection', () => {
  // Test to ensure unauthenticated users cannot access the stats endpoint
  it('should return 401 if not authenticated for POST /api/user/stats', async () => {
    const response = await request(app)
      .post('/api/user/stats')
      .send({ mana: 10, mageMeter: 50 });
    expect(response.status).toBe(401);
  });
});
