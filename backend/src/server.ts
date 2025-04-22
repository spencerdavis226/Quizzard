import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config';

// Import routes
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';
import userRoutes from './routes/user';
import leaderboardRoutes from './routes/leaderboard';
import apiLimiter from './middleware/rateLimiter';

// Create an Express application
const app = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Connect Mongoose to MongoDB
mongoose
  .connect(config.mongoURI)
  .then(() => console.log(`Connecting to MongoDB at: ${config.mongoURI}`))
  .catch((err) => console.error('MongoDB connection error:', err));

// Apply rate limiter to all routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Sanity check
app.get('/', (req, res) => {
  res.send('Welcome to Quizzard Backend');
});

// Binds and listens for connections on the specified host and port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
