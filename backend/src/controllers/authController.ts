import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import config from '../config';

// Interface for registration request body
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Interface for login request body
interface LoginRequest {
  email: string;
  password: string;
}

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body as RegisterRequest;

    // Check for duplicate email or username
    if (await User.exists({ email })) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }
    if (await User.exists({ username })) {
      res.status(400).json({ error: 'Username already in use' });
      return;
    }

    // Create new user (password hashing handled by pre-save hook)
    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err: unknown) {
    // Handle mongoose validation errors (username/email format, etc)
    if (err instanceof mongoose.Error.ValidationError) {
      const errorMessages = Object.values(err.errors).map((e) => e.message);
      res.status(400).json({ error: errorMessages.join(', ') });
      return;
    }

    // General server error
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login a user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Find user by email (including password field which is excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT token with user ID and username
    const token = jwt.sign(
      { id: user._id, username: user.username },
      config.jwtSecret,
      { expiresIn: '24h' } // Increased from 1h for better user experience
    );

    // Return token to client
    res.json({ token });
  } catch (err: unknown) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
