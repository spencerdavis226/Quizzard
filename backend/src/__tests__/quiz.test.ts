import request from 'supertest';
import app from '../server';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User'; // Import User model

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

// Tests for the quiz endpoints
describe('GET /api/quiz', () => {
  // Test successful fetch of 10 quiz questions
  it('should fetch 10 quiz questions', async () => {
    // Mock Open Trivia DB API response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        response_code: 0,
        results: [
          {
            question: 'Question 1',
            correct_answer: 'Answer 1',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 2',
            correct_answer: 'Answer 2',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 3',
            correct_answer: 'Answer 3',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 4',
            correct_answer: 'Answer 4',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 5',
            correct_answer: 'Answer 5',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 6',
            correct_answer: 'Answer 6',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 7',
            correct_answer: 'Answer 7',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 8',
            correct_answer: 'Answer 8',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 9',
            correct_answer: 'Answer 9',
            incorrect_answers: ['A', 'B', 'C'],
          },
          {
            question: 'Question 10',
            correct_answer: 'Answer 10',
            incorrect_answers: ['A', 'B', 'C'],
          },
        ],
      },
    });

    const response = await request(app)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${validToken('testUserId')}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
    expect(response.body[0]).toHaveProperty('question');
    expect(response.body[0]).toHaveProperty('correct_answer');
    expect(response.body[0]).toHaveProperty('incorrect_answers');
  });

  // Test failure scenario when Open Trivia DB API fails
  it('should return 400 if Open Trivia DB fails', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { response_code: 1 },
    });

    const response = await request(app)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${validToken('testUserId')}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Failed to fetch questions');
  });
});

// Tests for submitting quiz scores
describe('POST /api/quiz/submit', () => {
  // Test successful quiz score submission
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
      mana: 0,
      mageMeter: 0,
    });
    await user.save();

    // Submit invalid quiz data
    const response = await request(app)
      .post('/api/quiz/submit')
      .set('Authorization', `Bearer ${validToken(user._id.toString())}`)
      .send({
        category: '', // Invalid category
        difficulty: 'medium',
        questionCount: 10,
        correctAnswers: 7,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid quiz data');
  });
});

// Tests for authentication protection on quiz endpoints
describe('Quiz Auth Protection', () => {
  // Test unauthenticated access to GET /api/quiz
  it('should return 401 if no token is provided for GET /api/quiz', async () => {
    const response = await request(app).get('/api/quiz');
    expect(response.status).toBe(401);
  });

  // Test unauthenticated access to POST /api/quiz/submit
  it('should return 401 if no token is provided for POST /api/quiz/submit', async () => {
    const response = await request(app).post('/api/quiz/submit').send({
      category: 'General',
      difficulty: 'easy',
      questionCount: 5,
      correctAnswers: 3,
    });
    expect(response.status).toBe(401);
  });

  // Test invalid token access
  it('should return 401 if token is invalid', async () => {
    const response = await request(app)
      .get('/api/quiz')
      .set('Authorization', 'Bearer invalidtoken');
    expect(response.status).toBe(401);
  });
});
