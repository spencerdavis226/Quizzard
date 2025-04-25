import axios from 'axios';
import { Request, Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Fetch 10 quiz questions from Open Trivia DB
export const getQuizQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category, difficulty } = req.query;

    // Build the Open Trivia DB API URL
    const url = `https://opentdb.com/api.php?amount=10&type=multiple${
      category ? `&category=${category}` : ''
    }${difficulty ? `&difficulty=${difficulty}` : ''}`;

    // Fetch questions from Open Trivia DB
    const response = await axios.get(url);

    // Handle Open Trivia DB session exhausted (response_code 5)
    if (response.data.response_code === 5) {
      res.status(400).json({
        error:
          'No more questions available for this selection. Try a different category or difficulty.',
      });
      return;
    }

    if (response.data.response_code !== 0 || !response.data.results.length) {
      res.status(400).json({
        error:
          'No questions found for this selection. Try a different category or difficulty.',
      });
      return;
    }

    res.status(200).json(response.data.results);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Axios error:',
        error.message,
        error.response?.data,
        error.code,
        error.config
      );
    } else {
      console.error('Unknown error:', error);
    }
    res
      .status(502)
      .json({ error: 'Failed to fetch questions from external API.' });
  }
};

// Handle quiz score submission and update user stats
export const submitQuizScore = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { category, difficulty, questionCount, correctAnswers } = req.body;

    // Basic validation
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

    // Update user stats
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.mana += correctAnswers;
    user.mageMeter = Math.min(
      100,
      Math.round((correctAnswers / questionCount) * 100)
    );
    await user.save();

    // Return the score for splash screen use
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
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
