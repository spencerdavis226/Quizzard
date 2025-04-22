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

    if (response.data.response_code !== 0) {
      res.status(400).json({ error: 'Failed to fetch questions' });
      return;
    }

    res.status(200).json(response.data.results);
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Server error' });
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
      typeof correctAnswers !== 'number'
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
