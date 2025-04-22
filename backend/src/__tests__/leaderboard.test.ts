import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User, { IUser } from '../models/User';
import Score from '../models/Score';
import { validToken } from './testUtils';

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
  await Score.deleteMany({});

  // Create a test user and a test friend
  testUser = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    mana: 50,
    mageMeter: 80,
  });
  await testUser.save();

  testFriend = new User({
    username: 'testfriend',
    email: 'friend@example.com',
    password: 'password123',
    mana: 30,
    mageMeter: 70,
  });
  await testFriend.save();

  // Add the friend to the test user's friends list
  testUser.friends.push(testFriend._id);
  await testUser.save();

  // Create 10 Score documents for each user so they appear on the leaderboard
  for (let i = 0; i < 10; i++) {
    await Score.create({
      user: testUser._id,
      category: 'General',
      difficulty: 'easy',
      questionCount: 10,
      correctAnswers: 8,
    });
    await Score.create({
      user: testFriend._id,
      category: 'General',
      difficulty: 'easy',
      questionCount: 10,
      correctAnswers: 7,
    });
  }
});

// Tests for the leaderboard endpoints
describe('GET /api/leaderboard/global', () => {
  // Test fetching the global leaderboard sorted by mana
  it('should fetch the global leaderboard sorted by mana', async () => {
    const response = await request(app)
      .get('/api/leaderboard/global')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.leaderboard)).toBe(true);
    expect(response.body.leaderboard[0].username).toBe('testuser');
    expect(response.body.leaderboard[1].username).toBe('testfriend');
  });
});

// Tests for the friends leaderboard endpoint
describe('GET /api/leaderboard/friends', () => {
  // Test fetching the friends leaderboard sorted by mana
  it('should fetch the friends leaderboard sorted by mana', async () => {
    const response = await request(app)
      .get('/api/leaderboard/friends')
      .set('Authorization', `Bearer ${validToken(testUser._id)}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.leaderboard)).toBe(true);
    expect(response.body.leaderboard[0].username).toBe('testuser');
    expect(response.body.leaderboard[1].username).toBe('testfriend');
  });
});
