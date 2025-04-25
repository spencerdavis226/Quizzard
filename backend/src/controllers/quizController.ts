import axios from 'axios';
import { Request, Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Define interfaces for Open Trivia DB responses
interface OpenTriviaQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTriviaResponse {
  response_code: number;
  results: OpenTriviaQuestion[];
}

// Define interface for quiz score submission
interface QuizScoreSubmission {
  category: string;
  difficulty: string;
  questionCount: number;
  correctAnswers: number;
}

// Fetch 10 quiz questions from Open Trivia DB based on category and difficulty
export const getQuizQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category, difficulty } = req.query;

    // Build the Open Trivia DB API URL with optional filters
    const url = `https://opentdb.com/api.php?amount=10&type=multiple${
      category ? `&category=${category}` : ''
    }${difficulty ? `&difficulty=${difficulty}` : ''}`;

    // Fetch questions from Open Trivia DB
    const response = await axios.get<OpenTriviaResponse>(url);

    // Handle session exhausted case (response_code 5)
    if (response.data.response_code === 5) {
      res.status(400).json({
        error:
          'No more questions available for this selection. Try a different category or difficulty.',
      });
      return;
    }

    // Handle no results found or other API errors
    if (response.data.response_code !== 0 || !response.data.results.length) {
      res.status(400).json({
        error:
          'No questions found for this selection. Try a different category or difficulty.',
      });
      return;
    }

    // Return the questions if found
    res.status(200).json(response.data.results);
  } catch (error) {
    // Log detailed error for debugging
    if (axios.isAxiosError(error)) {
      console.error(
        'API error:',
        error.message,
        error.response?.data,
        error.code
      );
    } else {
      console.error('Unknown error:', error);
    }

    // Return a user-friendly error message
    res.status(502).json({
      error: 'Failed to fetch questions from external API.',
    });
  }
};

// Handle quiz score submission and update user stats
export const submitQuizScore = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      category,
      difficulty,
      questionCount,
      correctAnswers,
    }: QuizScoreSubmission = req.body;

    // Validate required fields and reasonable values
    if (
      !category ||
      !difficulty ||
      !questionCount ||
      typeof correctAnswers !== 'number' ||
      questionCount < 1 ||
      correctAnswers < 0 ||
      correctAnswers > questionCount
    ) {
      res.status(400).json({ error: 'Invalid quiz data' });
      return;
    }

    // Find user and update stats
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update user's mana (total correct answers) and mageMeter (accuracy %)
    user.mana += correctAnswers;
    user.mageMeter = Math.min(
      100,
      Math.round((correctAnswers / questionCount) * 100)
    );
    await user.save();

    // Return updated stats and score summary for the UI
    res.status(200).json({
      message: 'Score submitted successfully',
      user: { mana: user.mana, mageMeter: user.mageMeter },
      score: {
        category,
        difficulty,
        questionCount,
        correctAnswers,
        percentage: Math.round((correctAnswers / questionCount) * 100),
      },
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
