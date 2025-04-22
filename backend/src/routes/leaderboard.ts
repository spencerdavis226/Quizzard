import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getGlobalLeaderboard,
  getFriendLeaderboard,
} from '../controllers/leaderboardController';

const router = Router();

// Leaderboard routes
router.get('/global', getGlobalLeaderboard);
router.get('/friends', authenticate, getFriendLeaderboard);

export default router;
