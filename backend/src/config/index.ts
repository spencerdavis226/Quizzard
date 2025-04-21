import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

export default {
  port: process.env.PORT || 5005,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/quizzard',
  jwtSecret: process.env.JWT_SECRET || 'fallbackSecret',
};
