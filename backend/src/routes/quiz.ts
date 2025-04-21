import { Router } from 'express';
import { fetchQuizQuestions } from '../controllers/quizController';

const router = Router();

// Route to fetch quiz questions
router.get('/questions', fetchQuizQuestions);

export default router;
