import axios from 'axios';
import { Request, Response } from 'express';

// Define TypeScript interfaces for the API response
interface TriviaQuestion {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

// Fetch 10 questions from the Open Trivia DB API
export const fetchQuizQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category, difficulty } = req.query;

    // Validate query parameters
    if (!category || !difficulty) {
      res.status(400).json({ error: 'Category and difficulty are required' });
      return;
    }

    // Fetch questions from Open Trivia DB
    const response = await axios.get('https://opentdb.com/api.php', {
      params: {
        amount: 10,
        category,
        difficulty,
        type: 'multiple',
      },
    });

    // Validate the API response structure
    if (!response.data || !Array.isArray(response.data.results)) {
      res.status(500).json({ error: 'Invalid API response format' });
      return;
    }

    // Normalize the response
    const questions = response.data.results.map((q: TriviaQuestion) => ({
      questionText: q.question,
      correctAnswer: q.correct_answer,
      incorrectAnswers: q.incorrect_answers,
    }));

    res.json({ success: true, questions });
  } catch (err) {
    console.error('Error fetching quiz questions:', err);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
};
