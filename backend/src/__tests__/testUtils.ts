import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

// Create a test user in the database
export const createTestUser = async () => {
  const testUser = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123', // This will be hashed by the pre-save hook
  });
  await testUser.save();

  const testFriend = new User({
    username: 'testfriend',
    email: 'testfriend@example.com',
    password: 'password123',
  });
  await testFriend.save();

  return { testUser, testFriend };
};

// Generate a valid JWT token for a given user ID
export const validToken = (userId: string | mongoose.Types.ObjectId) => {
  return jwt.sign({ id: userId.toString() }, jwtSecret, { expiresIn: '1h' });
};
