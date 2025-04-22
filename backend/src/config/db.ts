import mongoose from 'mongoose';
import config from './index';

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log(`Connected to MongoDB at: ${config.mongoURI}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error disconnecting from MongoDB:', err);
  }
};
