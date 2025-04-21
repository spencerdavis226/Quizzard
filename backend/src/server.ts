import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config';

import authRoutes from './routes/auth';

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

// Routes
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
  res.send('Welcome to Quizzard Backend');
});

// Binds and listens for connections on the specified host and port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
