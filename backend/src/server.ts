import express from 'express';
import cors from 'cors';
import config from './config';
import { connectDB } from './config/db';

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

// Connect to MongoDB
connectDB();

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
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// Export the app instance for testing
export default app;
