// Import dependencies and styles
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/token';
import './QuizPage.css';

// Quiz question type
interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

// Decode HTML entities
function decodeHtml(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

const QuizPage: React.FC = () => {
  // State for questions, answers, etc.
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch quiz questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = getToken();
        if (!token) throw new Error('Authentication token not found');
        const response = await fetch('/api/quiz', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch quiz questions');
        }
        const data = await response.json();
        // Transform and shuffle options
        const transformed: Question[] = data.questions.map(
          (q: {
            question: string;
            correct_answer: string;
            incorrect_answers: string[];
          }) => {
            const options = [...q.incorrect_answers, q.correct_answer].map(
              decodeHtml
            );
            for (let i = options.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [options[i], options[j]] = [options[j], options[i]];
            }
            return {
              question: decodeHtml(q.question),
              options,
              correct_answer: decodeHtml(q.correct_answer),
            };
          }
        );
        setQuestions(transformed);
        setUserAnswers(Array(transformed.length).fill(-1));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not load quiz questions.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Handle answer selection
  const handleSelect = (idx: number) => {
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[currentQuestionIndex] = idx;
      return updated;
    });
  };

  // Handle next or submit
  const handleNextOrSubmit = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      return;
    }
    setSubmitting(true);
    try {
      // Calculate correct answers
      const correct = questions.reduce((acc, q, i) => {
        if (
          userAnswers[i] !== -1 &&
          q.options[userAnswers[i]] === q.correct_answer
        ) {
          return acc + 1;
        }
        return acc;
      }, 0);
      const token = getToken();
      if (!token) throw new Error('Authentication token not found');
      const payload = {
        category: 'Mixed',
        difficulty: 'mixed',
        questionCount: questions.length,
        correctAnswers: correct,
      };
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
      const resultData = await response.json();
      navigate('/quiz-results', {
        state: {
          mana: resultData.user.mana,
          mageMeter: resultData.user.mageMeter,
          questions,
          userAnswers,
          score: resultData.score,
        },
      });
    } catch (err) {
      navigate('/quiz-results', {
        state: {
          questions,
          userAnswers,
          error:
            err instanceof Error ? err.message : 'Could not save quiz results.',
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading or error
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-emoji">🧙‍♂️</div>
        <p>Loading quiz...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-container">
        <div className="error-emoji">⚠️</div>
        <div style={{ color: 'red', marginBottom: 20 }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
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
  if (!questions.length) {
    return (
      <div className="error-container">
        <div className="loading-emoji">🧙‍♂️</div>
        <p>No questions available. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }
  // Main quiz UI
  const current = questions[currentQuestionIndex];
  const selected = userAnswers[currentQuestionIndex];
  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span style={{ fontWeight: 'bold' }}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
      </div>
      <h2 className="question-title">{current.question}</h2>
      <div className="options-container">
        {current.options.map((option, idx) => (
          <label
            key={idx}
            className={`option-label${
              selected === idx ? ' option-selected' : ''
            }`}
          >
            <input
              type="radio"
              name="answer"
              value={idx}
              checked={selected === idx}
              onChange={() => handleSelect(idx)}
              className="option-radio"
            />
            {option}
          </label>
        ))}
      </div>
      <div className="buttons-container">
        <button
          onClick={handleNextOrSubmit}
          disabled={selected === -1 || submitting}
          className={`button button-next${
            selected === -1 || submitting ? ' button-disabled' : ''
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
