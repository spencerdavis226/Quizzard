import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

// JWT payload interface - defines what we store in the JWT token
interface JwtPayload {
  id: string;
  username: string;
}

// Extend the Request interface to include the authenticated user data
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

// Authentication middleware
// Verifies JWT token from Authorization header and adds user data to request object
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Attach the user information to the request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };

    next();
  } catch (error) {
    // Handle different types of JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Any other error
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
