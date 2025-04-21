import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// REGISTER NEW USER
export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { username, email, password } = req.body;

    // VALIDATION AND HASHING
    // Check for existing email
    if (await User.exists({ email })) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    // Check for existing username
    if (await User.exists({ username })) {
      return res.status(400).json({ error: 'Username already in use' });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE NEW USER
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err: unknown) {
    // Checks if the error is a mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
      // Get validation error messages (such as username rules defined in User.ts)
      const errorMessages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors: errorMessages.join(', ') });
    }
    // General (non-mongoose) error handling (eg connection issues)
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// LOGIN USER
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Find the user document store in MongoDB by email (and include password to compare)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Compare the password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
    // Return the token to the client
    return res.json({ token });
  } catch (err: unknown) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
