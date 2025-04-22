import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  port: process.env.PORT || 5005,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/quizzard',
  jwtSecret: process.env.JWT_SECRET || 'fallbackSecret',
};

export default config;
