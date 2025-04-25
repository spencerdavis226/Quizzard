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

interface TokenResponse {
  response_code: number;
  response_message?: string;
  token?: string;
}

// Define interface for quiz score submission
interface QuizScoreSubmission {
  category: string;
  difficulty: string;
  questionCount: number;
  correctAnswers: number;
}

// Store session tokens in memory with expiry tracking
interface TokenCache {
  [ip: string]: {
    token: string;
    expires: number; // timestamp when token expires
    lastRequestTime: number; // timestamp of the last request made
  };
}

// Question cache interface
interface QuestionsCache {
  questions: OpenTriviaQuestion[];
  timestamp: number;
}

// Cache of questions to reduce API calls - indexed by categories
const questionCache: Record<string, QuestionsCache> = {
  default: { questions: [], timestamp: 0 },
};

// Cache expiry time in milliseconds (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;

// Mock questions to use as fallback when API is rate limited
const mockQuestions: OpenTriviaQuestion[] = [
  {
    category: 'Science: Computers',
    type: 'multiple',
    difficulty: 'medium',
    question: 'What does CPU stand for?',
    correct_answer: 'Central Processing Unit',
    incorrect_answers: [
      'Central Program Unit',
      'Computer Personal Unit',
      'Central Processor Unit',
    ],
  },
  {
    category: 'Science: Computers',
    type: 'multiple',
    difficulty: 'easy',
    question: 'What does HTML stand for?',
    correct_answer: 'Hypertext Markup Language',
    incorrect_answers: [
      'Hypertext Markdown Language',
      'Hyperloop Machine Language',
      'Helicopters Terminals Motorboats Lamborginis',
    ],
  },
  {
    category: 'Entertainment: Books',
    type: 'multiple',
    difficulty: 'medium',
    question: 'Who wrote Harry Potter?',
    correct_answer: 'J.K. Rowling',
    incorrect_answers: ['J.R.R. Tolkien', 'Terry Pratchett', 'Stephen King'],
  },
  {
    category: 'Geography',
    type: 'multiple',
    difficulty: 'medium',
    question: 'What is the capital of France?',
    correct_answer: 'Paris',
    incorrect_answers: ['London', 'Berlin', 'Madrid'],
  },
  {
    category: 'History',
    type: 'multiple',
    difficulty: 'hard',
    question: 'In what year did World War II end?',
    correct_answer: '1945',
    incorrect_answers: ['1939', '1941', '1943'],
  },
  {
    category: 'Entertainment: Music',
    type: 'multiple',
    difficulty: 'easy',
    question: 'Who was the lead singer of Queen?',
    correct_answer: 'Freddie Mercury',
    incorrect_answers: ['Mick Jagger', 'Robert Plant', 'David Bowie'],
  },
  {
    category: 'Science & Nature',
    type: 'multiple',
    difficulty: 'medium',
    question: 'What is the chemical symbol for gold?',
    correct_answer: 'Au',
    incorrect_answers: ['Ag', 'Fe', 'Go'],
  },
  {
    category: 'Entertainment: Film',
    type: 'multiple',
    difficulty: 'easy',
    question: 'Who directed Jurassic Park?',
    correct_answer: 'Steven Spielberg',
    incorrect_answers: ['James Cameron', 'Christopher Nolan', 'George Lucas'],
  },
  {
    category: 'General Knowledge',
    type: 'multiple',
    difficulty: 'medium',
    question: 'What is the largest organ in the human body?',
    correct_answer: 'Skin',
    incorrect_answers: ['Liver', 'Heart', 'Brain'],
  },
  {
    category: 'Sports',
    type: 'multiple',
    difficulty: 'medium',
    question: 'In which sport would you perform a slam dunk?',
    correct_answer: 'Basketball',
    incorrect_answers: ['Football', 'Tennis', 'Volleyball'],
  },
];

// Cache of session tokens - will be cleared on server restart
const sessionTokens: TokenCache = {};
// Token expiry time in milliseconds (slightly less than the 6 hours the API uses)
const TOKEN_EXPIRY = 5.5 * 60 * 60 * 1000; // 5.5 hours
// Minimum time between requests from the same IP (in milliseconds)
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds to respect rate limiting
// Maximum number of consecutive failures before falling back to mock data
const MAX_FAILURES = 3;

// Track failure count for backoff strategy
let consecutiveFailures = 0;
let lastFailureTime = 0;

// Get or create a session token for the current IP
const getSessionToken = async (ip: string): Promise<string> => {
  const now = Date.now();

  // Check if we have a non-expired token for this IP
  if (sessionTokens[ip] && sessionTokens[ip].expires > now) {
    // Update last request time
    sessionTokens[ip].lastRequestTime = now;
    return sessionTokens[ip].token;
  }

  try {
    // Get a new token from the API
    const response = await axios.get<TokenResponse>(
      'https://opentdb.com/api_token.php?command=request'
    );

    if (response.data.response_code === 0 && response.data.token) {
      // Store the new token with expiry
      sessionTokens[ip] = {
        token: response.data.token,
        expires: now + TOKEN_EXPIRY,
        lastRequestTime: now,
      };
      return response.data.token;
    }

    throw new Error('Failed to retrieve session token');
  } catch (error) {
    console.error('Token API error:', error);
    // If we can't get a token, return empty string - quiz will still work but might repeat questions
    return '';
  }
};

// Reset a session token if it's exhausted (response code 4)
const resetSessionToken = async (ip: string): Promise<string> => {
  try {
    if (!sessionTokens[ip]?.token) {
      return await getSessionToken(ip);
    }

    const token = sessionTokens[ip].token;
    const response = await axios.get<TokenResponse>(
      `https://opentdb.com/api_token.php?command=reset&token=${token}`
    );

    if (response.data.response_code === 0) {
      // Update expiry time and last request time
      const now = Date.now();
      sessionTokens[ip].expires = now + TOKEN_EXPIRY;
      sessionTokens[ip].lastRequestTime = now;
      return token;
    }

    // If reset fails, get a new token
    return await getSessionToken(ip);
  } catch (error) {
    console.error('Token reset error:', error);
    // Try to get a new token as fallback
    return await getSessionToken(ip);
  }
};

// Function to enforce rate limiting
const enforceRateLimit = async (ip: string): Promise<void> => {
  const now = Date.now();

  if (sessionTokens[ip] && sessionTokens[ip].lastRequestTime) {
    const timeElapsed = now - sessionTokens[ip].lastRequestTime;

    if (timeElapsed < MIN_REQUEST_INTERVAL) {
      // Need to wait before making another request
      const delayNeeded = MIN_REQUEST_INTERVAL - timeElapsed;
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }
  }

  // Update last request time after waiting (if needed)
  if (!sessionTokens[ip]) {
    sessionTokens[ip] = {
      token: '',
      expires: 0,
      lastRequestTime: now,
    };
  } else {
    sessionTokens[ip].lastRequestTime = now;
  }
};

// Check if cached questions are valid (not expired)
const hasCachedQuestions = (category: string = 'default'): boolean => {
  const cacheKey = category || 'default';
  const cache = questionCache[cacheKey];

  if (!cache) return false;

  const now = Date.now();
  return cache.questions.length > 0 && now - cache.timestamp < CACHE_EXPIRY;
};

// Get cached questions
const getCachedQuestions = (
  category: string = 'default'
): OpenTriviaQuestion[] => {
  const cacheKey = category || 'default';
  return questionCache[cacheKey]?.questions || [];
};

// Update question cache
const updateQuestionCache = (
  questions: OpenTriviaQuestion[],
  category: string = 'default'
): void => {
  const cacheKey = category || 'default';
  questionCache[cacheKey] = {
    questions,
    timestamp: Date.now(),
  };

  // Reset failure count on successful cache update
  consecutiveFailures = 0;
};

// Implement exponential backoff for API retries
const shouldUseBackoff = (): boolean => {
  if (consecutiveFailures === 0) return false;

  const now = Date.now();
  const backoffTime = Math.min(30000, Math.pow(2, consecutiveFailures) * 1000);

  return now - lastFailureTime < backoffTime;
};

// Get mock questions with randomized order
const getMockQuestions = (): OpenTriviaQuestion[] => {
  // Create a copy of mock questions to avoid modifying the original array
  const questions = [...mockQuestions];

  // Shuffle the array using Fisher-Yates algorithm
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions;
};

// Fetch 10 random quiz questions from Open Trivia DB
export const getQuizQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the client's IP address for token management
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Check if we need to use backoff strategy due to API issues
    if (shouldUseBackoff()) {
      console.log(
        `Using backoff strategy after ${consecutiveFailures} failures. Serving mock questions.`
      );
      res.status(200).json(getMockQuestions());
      return;
    }

    // Check if we have valid cached questions first
    if (hasCachedQuestions()) {
      console.log('Serving quiz questions from cache');
      res.status(200).json(getCachedQuestions());
      return;
    }

    // Enforce rate limit based on IP
    await enforceRateLimit(clientIp);

    // Get or create a session token for this IP
    let token = await getSessionToken(clientIp);

    // Add a delay to respect rate limiting (2 seconds between requests from same IP)
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small extra safety delay

    // Build the URL - not using category or difficulty (random category, medium difficulty)
    let url = `https://opentdb.com/api.php?amount=10&type=multiple`;

    // Add token if we have one
    if (token) {
      url += `&token=${token}`;
    }

    // Fetch questions from Open Trivia DB
    const response = await axios.get<OpenTriviaResponse>(url);

    // Handle session token exhausted (response_code 4)
    if (response.data.response_code === 4) {
      token = await resetSessionToken(clientIp);

      // Add rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL));

      // Try again with the reset token
      const newResponse = await axios.get<OpenTriviaResponse>(
        `${url}&token=${token}`
      );

      if (newResponse.data.response_code === 0) {
        // Successfully retrieved questions after token reset
        updateQuestionCache(newResponse.data.results);
        res.status(200).json(newResponse.data.results);
        return;
      }
    }

    // Handle rate limiting (response_code 5)
    if (response.data.response_code === 5) {
      // Record failure and use mock data instead of error
      consecutiveFailures++;
      lastFailureTime = Date.now();
      console.log('Rate limit reached, using mock questions');
      res.status(200).json(getMockQuestions());
      return;
    }

    // Handle no results found or other API errors
    if (response.data.response_code !== 0 || !response.data.results.length) {
      // Check if we have cached questions as fallback
      if (hasCachedQuestions()) {
        console.log('API returned no results, using cached questions');
        res.status(200).json(getCachedQuestions());
      } else {
        // Use mock data as last resort
        console.log('API returned no results, using mock questions');
        res.status(200).json(getMockQuestions());
      }
      return;
    }

    // Successfully got questions from API
    updateQuestionCache(response.data.results);
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

      // Record failure
      consecutiveFailures++;
      lastFailureTime = Date.now();

      // Special handling for rate limiting errors from the external API
      if (error.response?.status === 429) {
        console.log('External API rate limited, using fallback data');

        // Try serving cached questions first if available
        if (hasCachedQuestions()) {
          res.status(200).json(getCachedQuestions());
        } else {
          // Use mock questions if no cache is available
          res.status(200).json(getMockQuestions());
        }
        return;
      }
    } else {
      console.error('Unknown error:', error);
      consecutiveFailures++;
      lastFailureTime = Date.now();
    }

    // Use cached questions if available
    if (hasCachedQuestions()) {
      console.log('Error fetching from API, using cached questions');
      res.status(200).json(getCachedQuestions());
      return;
    }

    // Return mock questions instead of an error
    console.log('Error fetching from API, using mock questions');
    res.status(200).json(getMockQuestions());
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
      !questionCount ||
      typeof correctAnswers !== 'number' ||
      questionCount < 1 ||
      correctAnswers < 0 ||
      correctAnswers > questionCount
    ) {
      res.status(400).json({ error: 'Invalid quiz data' });
      return;
    }

    // Calculate the new values to update
    const newMana = correctAnswers; // Add correct answers to mana
    const newMageMeter = Math.min(
      100,
      Math.round((correctAnswers / questionCount) * 100)
    );

    // Update user stats directly in the database, bypassing validation of other fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { mana: newMana },
        $set: { mageMeter: newMageMeter },
      },
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return updated stats and score summary for the UI
    res.status(200).json({
      message: 'Score submitted successfully',
      user: { mana: updatedUser.mana, mageMeter: updatedUser.mageMeter },
      score: {
        category, // This is now the actual category from the quiz questions
        difficulty: 'mixed', // We're using mixed difficulty
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
