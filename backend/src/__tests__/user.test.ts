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

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

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

describe('GET /api/user', () => {
  it('should return 401 if not authenticated', async () => {
    const response = await request(app).get('/api/user/me');
    expect(response.status).toBe(401);
  });
});

describe('User Endpoints', () => {
  it('should retrieve the user profile', async () => {
    const response = await request(app)
      .get('/api/user/me')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', testUser.username);
  });

  it('should update the user profile', async () => {
    const response = await request(app)
      .put('/api/user/me')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: 'updateduser' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'updateduser');
  });

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

describe('Friend management edge cases', () => {
  it('should return 404 when adding a non-existent user as a friend', async () => {
    const response = await request(app)
      .post('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: 'ghostuser' });
    expect(response.status).toBe(404);
  });

  it('should return 404 when removing a non-existent user as a friend', async () => {
    const response = await request(app)
      .delete('/api/user/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`)
      .send({ username: 'ghostuser' });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/user/me', () => {
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

describe('GET /api/user/friends', () => {
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

describe('User stats protection', () => {
  it('should return 401 if not authenticated for POST /api/user/stats', async () => {
    const response = await request(app)
      .post('/api/user/stats')
      .send({ mana: 10, mageMeter: 50 });
    expect(response.status).toBe(401);
  });
});
