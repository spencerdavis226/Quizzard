import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  updateUserStats,
  getUserStats,
  changePassword,
  addFriend,
  removeFriend,
  getFriendsList,
} from '../controllers/userController';

const router = Router();

// User profile routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.delete('/me', authenticate, deleteAccount);
router.post('/change-password', authenticate, changePassword);
router.post('/stats', authenticate, updateUserStats);
router.get('/stats/:userId', getUserStats);

// Friend management routes
router.post('/friends', authenticate, addFriend);
router.delete('/friends', authenticate, removeFriend);
router.get('/friends', authenticate, getFriendsList);

export default router;
