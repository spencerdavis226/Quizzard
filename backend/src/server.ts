import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config';

const app = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json());

mongoose
  .connect(config.mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// MongoDB Server Check
console.log(`Connecting to MongoDB at: ${config.mongoURI}`);

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Quizzard Backend');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
