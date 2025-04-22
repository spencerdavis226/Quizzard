import { Router } from 'express';
import {
  getQuizQuestions,
  submitQuizScore,
} from '../controllers/quizController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Quiz routes
router.get('/', authenticate, getQuizQuestions); // Get quiz questions
router.post('/submit', authenticate, submitQuizScore);

export default router;
