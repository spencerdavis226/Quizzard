import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getProfile,
  updateProfile,
  deleteAccount,
} from '../controllers/userController';

const router = Router();

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.delete('/me', authenticate, deleteAccount);

export default router;
