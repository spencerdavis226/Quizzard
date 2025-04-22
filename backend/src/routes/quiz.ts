import { Router } from 'express';
import {
  getQuizQuestions,
  submitQuizScore,
} from '../controllers/quizController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Fetch 10 quiz questions
router.get('/', authenticate, getQuizQuestions);

// Submit quiz score
router.post('/submit', authenticate, submitQuizScore);

export default router;
