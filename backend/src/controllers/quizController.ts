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

// Store the session token in memory
let triviaSessionToken: string | null = null;

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

// Helper to reset a session token
async function resetTriviaSessionToken(token: string): Promise<string> {
  const resp = await axios.get(
    `https://opentdb.com/api_token.php?command=reset&token=${token}`
  );
  if (resp.data && resp.data.token) {
    return resp.data.token;
  }
  throw new Error('Could not reset trivia session token');
}

// On server start, get a session token
(async () => {
  try {
    triviaSessionToken = await getTriviaSessionToken();
    console.log('Trivia session token acquired');
  } catch (err) {
    console.error('Failed to get trivia session token:', err);
  }
})();

// Fetch quiz questions from Open Trivia DB
export const getQuizQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  async function fetchQuestionsWithToken(token: string | null) {
    const url = `https://opentdb.com/api.php?amount=10&type=multiple${
      token ? `&token=${token}` : ''
    }`;
    return axios.get<OpenTriviaResponse>(url);
  }

  // Helper to wait for ms milliseconds
  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    let response;
    try {
      response = await fetchQuestionsWithToken(triviaSessionToken);
    } catch (error: any) {
      // If 429, wait 5 seconds and retry once
      if (error.response && error.response.status === 429) {
        await wait(5000);
        response = await fetchQuestionsWithToken(triviaSessionToken);
      } else {
        throw error;
      }
    }
    // If token error, reset or get new token and retry once
    if (
      response.data.response_code === 3 ||
      response.data.response_code === 4
    ) {
      if (triviaSessionToken) {
        triviaSessionToken = await resetTriviaSessionToken(triviaSessionToken);
      } else {
        triviaSessionToken = await getTriviaSessionToken();
      }
      response = await fetchQuestionsWithToken(triviaSessionToken);
    }
    if (
      response.data.response_code !== 0 ||
      !Array.isArray(response.data.results) ||
      response.data.results.length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'No questions found. Please try again later.',
        questions: [],
      });
      return;
    }
    res.status(200).json({
      success: true,
      questions: response.data.results,
    });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz questions. Please try again later.',
      questions: [],
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

    // Always return a consistent structure
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
