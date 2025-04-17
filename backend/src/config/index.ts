import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5005,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/quizzard',
  jwtSecret: process.env.JWT_SECRET || 'fallbackSecret',
};
