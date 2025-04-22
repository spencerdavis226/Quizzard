import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

// JWT payload interface
interface JwtPayload {
  id: string;
  username: string;
}

// Extend the Request interface to include the user property
// (This allows us to access the user id and username in the request object)
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

// Middleware function to authenticate the user
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Invalid authorization header format' });
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
    // Token expired
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    // Invalid token
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    // Other errors
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
