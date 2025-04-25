import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/token';
import './QuizPage.css';

// Define types for quiz questions and API response
interface Question {
  question: string;
  category: string;
  difficulty: string;
  options: string[];
  correct_answer: string;
}

interface OpenTriviaQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface QuizState {
  questions: Question[];
  userAnswers: number[];
  timedOutQuestions: boolean[];
  currentQuestionIndex: number;
  timeRemaining: number;
}

// Constants
const TIME_PER_QUESTION_SECONDS = 10;
const MAX_RETRIES = 3;

// Helper function to decode HTML entities in question text
const decodeHtml = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

// Helper to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Main QuizPage component
const QuizPage: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    userAnswers: [],
    timedOutQuestions: [],
    currentQuestionIndex: 0,
    timeRemaining: TIME_PER_QUESTION_SECONDS,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const timerIdRef = useRef<number | null>(null);

  // Destructure quiz state for easier access
  const {
    questions,
    userAnswers,
    timedOutQuestions,
    currentQuestionIndex,
    timeRemaining,
  } = quizState;

  // Memoize the selected answer to reduce rerenders
  const selectedAnswerIdx = useMemo(() => {
    return userAnswers[currentQuestionIndex];
  }, [userAnswers, currentQuestionIndex]);

  // Calculate question timed out status
  const isCurrentQuestionTimedOut = useMemo(() => {
    return timedOutQuestions[currentQuestionIndex];
  }, [timedOutQuestions, currentQuestionIndex]);

  // Start the timer when a new question is displayed
  const startTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
    if (isCurrentQuestionTimedOut) {
      return;
    }
    setQuizState((prev) => ({
      ...prev,
      timeRemaining: TIME_PER_QUESTION_SECONDS,
    }));
    timerIdRef.current = window.setInterval(() => {
      setQuizState((prev) => {
        if (prev.timeRemaining <= 1) {
          if (timerIdRef.current) clearInterval(timerIdRef.current);
          // Mark question as timed out if no answer selected
          const newTimedOutQuestions = [...prev.timedOutQuestions];
          if (prev.userAnswers[prev.currentQuestionIndex] === -1) {
            newTimedOutQuestions[prev.currentQuestionIndex] = true;
          }
          return {
            ...prev,
            timeRemaining: 0,
            timedOutQuestions: newTimedOutQuestions,
          };
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        };
      });
    }, 1000);
  }, [isCurrentQuestionTimedOut]);

  // Timer Bar UI
  const timerBarWidth = useMemo(() => {
    return (timeRemaining / TIME_PER_QUESTION_SECONDS) * 100;
  }, [timeRemaining]);

  // Timer bar color: blue normally, red if <= 3 seconds
  const timerBarColor = timeRemaining <= 3 ? '#f44336' : '#007bff';

  // Fetch quiz questions on component mount or retry
  useEffect(() => {
    const fetchQuestions = async (): Promise<void> => {
      setIsLoading(true);
      setError('');

      try {
        const token = getToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Make API request to backend
        const response = await fetch('/api/quiz', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Handle non-successful response
        if (!response.ok) {
          const errorData = await response.json();
          // Special handling for rate limiting
          if (response.status === 429) {
            throw new Error(
              'Rate limit reached. Please wait a moment before trying again.'
            );
          }
          throw new Error(errorData.error || 'Failed to fetch quiz questions');
        }

        // Process successful response
        const data = (await response.json()) as OpenTriviaQuestion[];

        // Transform API data into our Question format
        const transformedQuestions = data.map((q) => {
          // Decode HTML entities in question text and answers
          const decodedQuestion = decodeHtml(q.question);
          const decodedCorrectAnswer = decodeHtml(q.correct_answer);
          const decodedIncorrectAnswers = q.incorrect_answers.map(decodeHtml);

          // Combine and shuffle all answer options
          const options = [...decodedIncorrectAnswers, decodedCorrectAnswer];

          // Fisher-Yates shuffle algorithm for options
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }

          return {
            question: decodedQuestion,
            category: decodeHtml(q.category),
            difficulty: q.difficulty,
            options: options,
            correct_answer: decodedCorrectAnswer,
          };
        });

        // Update component state with questions and initialize arrays
        setQuizState({
          questions: transformedQuestions,
          userAnswers: Array(transformedQuestions.length).fill(-1),
          timedOutQuestions: Array(transformedQuestions.length).fill(false),
          currentQuestionIndex: 0,
          timeRemaining: TIME_PER_QUESTION_SECONDS,
        });

        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        // Handle error cases and provide user-friendly message
        console.error('Quiz data fetch error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load quiz questions. Please try again later.'
        );

        // Auto-retry up to MAX_RETRIES times for certain errors
        if (
          retryCount < MAX_RETRIES &&
          err instanceof Error &&
          (err.message.includes('rate limit') ||
            err.message.includes('Failed to fetch'))
        ) {
          setRetryCount((count) => count + 1);
          // Wait 5 seconds before retry (to respect API rate limits)
          setTimeout(() => {
            fetchQuestions();
          }, 5000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();

    // No need to clear timerId here, timer is managed elsewhere
    return () => {};
  }, [retryCount]); // Removed timerId from dependency array

  // Start timer when current question changes
  useEffect(() => {
    if (questions.length > 0 && !isLoading) {
      startTimer();
    }
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, [currentQuestionIndex, questions.length, isLoading, startTimer]);

  // Remove timer stop on answer select
  const handleSelect = (answerIdx: number): void => {
    if (isCurrentQuestionTimedOut || timeRemaining === 0) return;
    setQuizState((prev) => {
      const updatedAnswers = [...prev.userAnswers];
      updatedAnswers[currentQuestionIndex] = answerIdx;
      return {
        ...prev,
        userAnswers: updatedAnswers,
      };
    });
  };

  // Calculate progress percentage for progress bar
  const progress = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  // Navigate to next question or submit quiz
  const handleNextOrSubmit = async (): Promise<void> => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }

    // If not on last question, go to next question
    if (currentQuestionIndex < questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        timeRemaining: TIME_PER_QUESTION_SECONDS,
      }));
      return;
    }

    // Otherwise submit quiz results
    try {
      setSubmitting(true);

      // Calculate number of correct answers
      let correct = 0;
      questions.forEach((q, i) => {
        if (
          userAnswers[i] !== -1 &&
          !timedOutQuestions[i] &&
          q.options[userAnswers[i]] === q.correct_answer
        ) {
          correct++;
        }
      });

      // Find the most common category
      const categoryCounts: Record<string, number> = {};
      questions.forEach((q) => {
        categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
      });

      let primaryCategory = 'Mixed';
      let maxCount = 0;
      for (const [category, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryCategory = category;
        }
      }

      // Prepare payload for submission to API
      const payload = {
        category: primaryCategory,
        difficulty: 'mixed', // We're using mixed/random difficulties
        questionCount: questions.length,
        correctAnswers: correct,
      };

      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Submit score to backend API
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quiz');
      }

      // Process successful response and navigate to results page
      const resultData = await response.json();

      navigate('/quiz-results', {
        state: {
          mana: resultData.user.mana,
          mageMeter: resultData.user.mageMeter,
          questions,
          userAnswers,
          timedOutQuestions,
          score: resultData.score,
        },
      });
    } catch (err) {
      console.error('Quiz submission error:', err);

      // Navigate to results but pass the error and quiz data for local calculation
      navigate('/quiz-results', {
        state: {
          questions,
          userAnswers,
          timedOutQuestions,
          error:
            err instanceof Error
              ? err.message
              : 'Could not save quiz results. Your profile was not updated.',
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle going back to previous question
  const handlePrevious = (): void => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }

    if (currentQuestionIndex > 0) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        timeRemaining: TIME_PER_QUESTION_SECONDS,
      }));
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-emoji">🧙‍♂️</div>
        <p>
          Loading your magical quiz
          {retryCount > 0
            ? ` (Attempt ${retryCount + 1} of ${MAX_RETRIES + 1})`
            : ''}
          ...
        </p>
        {retryCount > 0 && (
          <p style={{ fontSize: 14, color: '#666' }}>
            The quiz API is busy. We're trying again in a few seconds...
          </p>
        )}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-emoji">⚠️</div>
        <div style={{ color: 'red', marginBottom: 20 }}>{error}</div>
        <button
          onClick={() => setRetryCount((count) => count + 1)} // Trigger retry
          className="retry-button"
        >
          Try Again
        </button>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Render empty state
  if (!questions.length) {
    return (
      <div className="error-container">
        <div className="loading-emoji">🧙‍♂️</div>
        <p>No questions available. Please try again.</p>
        <button
          onClick={() => setRetryCount((count) => count + 1)}
          className="retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Main quiz UI render
  return (
    <div className="quiz-container">
      {/* Question Category and Difficulty */}
      <div className="quiz-header">
        <div>
          <span style={{ fontWeight: 'bold' }}>Category:</span>{' '}
          {currentQuestion.category}
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Difficulty:</span>{' '}
          {capitalizeWords(currentQuestion.difficulty)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="timer-container">
        <div className="timer timer-normal">{timeRemaining}s</div>
        <div className="timer-bar-wrapper">
          <div
            className="timer-bar-fill"
            style={{ width: `${timerBarWidth}%`, background: timerBarColor }}
          />
        </div>
      </div>

      {/* Show timed out message if applicable */}
      {isCurrentQuestionTimedOut && (
        <div className="timed-out-message">
          Time's up! This question will be marked as incorrect.
        </div>
      )}

      {/* Question Text */}
      <h2 className="question-title">{currentQuestion.question}</h2>

      {/* Answer Options */}
      <div className="options-container">
        {currentQuestion.options.map((option, idx) => {
          // Determine option class based on state
          let optionClass = 'option-label';
          if (isCurrentQuestionTimedOut) {
            optionClass += ' option-disabled';

            // If this is the correct answer, highlight it
            if (option === currentQuestion.correct_answer) {
              optionClass += ' option-correct';
            }
          } else if (selectedAnswerIdx === idx) {
            optionClass += ' option-selected';
          }

          return (
            <label key={idx} className={optionClass}>
              <input
                type="radio"
                name="answer"
                value={idx}
                checked={selectedAnswerIdx === idx}
                onChange={() => handleSelect(idx)}
                disabled={isCurrentQuestionTimedOut}
                className="option-radio"
              />
              {option}
            </label>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="buttons-container">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`button button-previous${
            currentQuestionIndex === 0 ? ' button-disabled' : ''
          }`}
        >
          Previous
        </button>

        {/* Next/Submit Button */}
        <button
          onClick={handleNextOrSubmit}
          disabled={
            (selectedAnswerIdx === -1 && !isCurrentQuestionTimedOut) ||
            submitting
          }
          className={`button button-next${
            (selectedAnswerIdx === -1 && !isCurrentQuestionTimedOut) ||
            submitting
              ? ' button-disabled'
              : ''
          }`}
        >
          {currentQuestionIndex === questions.length - 1
            ? submitting
              ? 'Submitting...'
              : 'Submit Quiz'
            : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default QuizPage;
