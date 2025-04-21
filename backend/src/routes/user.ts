import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  updateUserStats,
  getUserStats,
  changePassword,
} from '../controllers/userController';

const router = Router();

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.delete('/me', authenticate, deleteAccount);
router.post('/change-password', authenticate, changePassword);
router.post('/stats', updateUserStats);
router.get('/stats/:userId', getUserStats);

export default router;
