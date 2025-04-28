import axios from 'axios';
import { Request, Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Open Trivia DB question interface
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

interface QuizScoreSubmission {
  category: string;
  difficulty: string;
  questionCount: number;
  correctAnswers: number;
}

// Use a Map to store questions by user ID
// This ensures each user gets their own consistent set of questions
const userQuestionsCache = new Map<string, OpenTriviaQuestion[]>();

// Helper to get a session token
async function getTriviaSessionToken(): Promise<string> {
  const resp = await axios.get(
    'https://opentdb.com/api_token.php?command=request'
  );
  if (resp.data && resp.data.token) {
    return resp.data.token;
  }
  throw new Error('Could not get trivia session token');
}

// Helper to fetch questions from the Open Trivia DB API
async function fetchQuestionsFromAPI(): Promise<OpenTriviaQuestion[]> {
  try {
    // Get a fresh token for each quiz session
    const token = await getTriviaSessionToken();

    const url = `https://opentdb.com/api.php?amount=10&type=multiple&token=${token}`;
    const response = await axios.get<OpenTriviaResponse>(url);

    if (
      response.data.response_code !== 0 ||
      !Array.isArray(response.data.results)
    ) {
      throw new Error(
        `API returned error code: ${response.data.response_code}`
      );
    }

    return response.data.results;
  } catch (error) {
    console.error('Error fetching trivia questions:', error);
    throw error;
  }
}

// Fetch quiz questions from Open Trivia DB
export const getQuizQuestions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user ID from the authenticated request
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        questions: [],
      });
      return;
    }

    // If we already have questions cached for this user, return those
    if (userQuestionsCache.has(userId)) {
      const cachedQuestions = userQuestionsCache.get(userId);
      res.status(200).json({
        success: true,
        questions: cachedQuestions,
      });
      return;
    }

    // Otherwise fetch new questions
    try {
      const questions = await fetchQuestionsFromAPI();

      // Cache the questions for this user
      userQuestionsCache.set(userId, questions);

      // Return the questions
      res.status(200).json({
        success: true,
        questions,
      });
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quiz questions. Please try again later.',
        questions: [],
      });
    }
  } catch (error) {
    console.error('Error in getQuizQuestions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      questions: [],
    });
  }
};

// Clear user's cached questions (call this when they finish a quiz)
export const clearUserQuestions = (userId: string): void => {
  if (userQuestionsCache.has(userId)) {
    userQuestionsCache.delete(userId);
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
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { category, difficulty, questionCount, correctAnswers } =
      req.body as QuizScoreSubmission;

    // Validate input
    if (
      typeof category !== 'string' ||
      typeof difficulty !== 'string' ||
      typeof questionCount !== 'number' ||
      typeof correctAnswers !== 'number' ||
      !category.trim() ||
      !difficulty.trim() ||
      questionCount < 1 ||
      correctAnswers < 0 ||
      correctAnswers > questionCount
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid quiz data',
      });
      return;
    }

    // Calculate new stats
    const manaToAdd = correctAnswers;
    const mageMeter = Math.min(
      100,
      Math.round((correctAnswers / questionCount) * 100)
    );

    // Update user stats
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { mana: manaToAdd },
        $set: { mageMeter },
      },
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Clear the cached questions for this user since they've completed the quiz
    clearUserQuestions(userId);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Score submitted successfully',
      user: {
        mana: updatedUser.mana,
        mageMeter: updatedUser.mageMeter,
      },
      score: {
        category,
        difficulty,
        questionCount,
        correctAnswers,
        percentage: mageMeter,
      },
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
