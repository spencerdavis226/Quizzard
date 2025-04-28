import request from 'supertest';
import app from '../server';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User';

// Mock database connection methods
jest.mock('../config/db', () => ({
  connectDB: jest.fn(),
  disconnectDB: jest.fn(),
}));

let mongoServer: MongoMemoryServer;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Cleanup in-memory MongoDB server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Ensure JWT_SECRET is defined in environment variables
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

// Generate a valid JWT token for testing
const validToken = (userId: string) => jwt.sign({ id: userId }, jwtSecret);

// Mock Open Trivia DB API to avoid real API calls during tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Tests for quiz question fetching
describe('GET /api/quiz', () => {
  // Test successful fetch of quiz questions
  it('should fetch 10 quiz questions successfully', async () => {
    // Mock Open Trivia DB API success response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        response_code: 0,
        results: Array(10)
          .fill(0)
          .map((_, i) => ({
            question: `Question ${i + 1}`,
            correct_answer: `Answer ${i + 1}`,
            incorrect_answers: ['A', 'B', 'C'],
          })),
      },
    });

    const response = await request(app)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${validToken('testUserId')}`);

    expect(response.status).toBe(200);
    expect(response.body.questions).toHaveLength(10);
    expect(response.body.questions[0]).toHaveProperty('question');
    expect(response.body.questions[0]).toHaveProperty('correct_answer');
    expect(response.body.questions[0]).toHaveProperty('incorrect_answers');
  });

  // Test API failure scenario - updated to match actual error message
  it('should return 400 if Open Trivia DB fails', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { response_code: 1 },
    });

    const response = await request(app)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${validToken('testUserId')}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      'No questions found. Please try again later.'
    );
  });
});

// Tests for quiz score submission
describe('POST /api/quiz/submit', () => {
  // Test successful score submission
  it('should submit a quiz score and update user stats', async () => {
    // Create a test user
    const user = new User({
      username: 'quizuser',
      email: 'quizuser@example.com',
      password: 'password123',
      mana: 0,
      mageMeter: 0,
    });
    await user.save();

    // Submit a quiz score
    const response = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${validToken(user._id.toString())}`)
      .send({
        category: 'General Knowledge',
        difficulty: 'medium',
        questionCount: 10,
        correctAnswers: 7,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Score submitted successfully'
    );
    expect(response.body.user).toHaveProperty('mana', 7);
    expect(response.body.user).toHaveProperty('mageMeter', 70);
  });

  // Test invalid quiz data submission
  it('should return 400 for invalid quiz data', async () => {
    // Create a test user
    const user = new User({
      username: 'quizuser2',
      email: 'quizuser2@example.com',
      password: 'password123',
    });
    await user.save();

    // Submit invalid quiz data (empty category)
    const response = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${validToken(user._id.toString())}`)
      .send({
        category: '',
        difficulty: 'medium',
        questionCount: 10,
        correctAnswers: 7,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid quiz data');
  });
});

// Basic auth protection tests
describe('Quiz API Authentication', () => {
  it('should require authentication for quiz endpoints', async () => {
    const response = await request(app).get('/api/quiz');
    expect(response.status).toBe(401);
  });
});
