import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getToken } from '../utils/token';

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizApiResponse {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

function decodeHtml(html: string) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

const QuizPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category, difficulty } = (location.state || {}) as {
    category?: string;
    difficulty?: string;
  };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = getToken();
        let url = '/api/quiz';
        const params = [];
        if (category) params.push(`category=${category}`);
        if (difficulty) params.push(`difficulty=${difficulty}`);
        if (params.length) url += `?${params.join('&')}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch questions');
        }
        const data: QuizApiResponse[] = await response.json();
        const transformed = data.map((q) => {
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
        });
        setQuestions(transformed);
        setUserAnswers(Array(transformed.length).fill(-1));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not load quiz questions.'
        );
      }
    };
    fetchQuestions();
  }, [category, difficulty]);

  // Handle answer selection
  const handleSelect = (answerIdx: number) => {
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[currentQuestionIndex] = answerIdx;
      return updated;
    });
  };

  // Progress bar
  const progress = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  // Next or Submit
  const handleNextOrSubmit = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      setSubmitting(true);
      // Calculate correct answers
      let correct = 0;
      questions.forEach((q, i) => {
        if (
          userAnswers[i] !== -1 &&
          q.options[userAnswers[i]] === q.correct_answer
        )
          correct++;
      });
      const payload = {
        category: category || 'Any',
        difficulty: difficulty || 'Any',
        questionCount: questions.length,
        correctAnswers: correct,
      };
      try {
        const token = getToken();
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to submit quiz');
        const resultData = await response.json();
        navigate('/quiz-results', {
          state: {
            mana: resultData.user.mana,
            mageMeter: resultData.user.mageMeter,
            questions,
            userAnswers,
          },
        });
      } catch {
        setError('Could not submit quiz.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (error)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>{error}</div>;
  if (!questions.length)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading...</div>;

  const current = questions[currentQuestionIndex];
  const selected = userAnswers[currentQuestionIndex];

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: 20,
        border: '1px solid #ccc',
        borderRadius: 8,
        background: '#f9f9f9',
      }}
    >
      {/* Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            height: 10,
            background: '#e0e0e0',
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#007bff',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <div style={{ textAlign: 'right', fontSize: 14, marginTop: 4 }}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>
      <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>
        {current.question}
      </h2>
      <form style={{ marginBottom: 24 }}>
        {current.options.map((option, idx) => (
          <label
            key={idx}
            style={{
              display: 'block',
              marginBottom: 12,
              cursor: 'pointer',
              background: selected === idx ? '#d0e7ff' : '#fff',
              borderRadius: 4,
              padding: '8px 12px',
              border: selected === idx ? '2px solid #007bff' : '1px solid #ccc',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="radio"
              name="answer"
              value={idx}
              checked={selected === idx}
              onChange={() => handleSelect(idx)}
              style={{ marginRight: 10 }}
            />
            {option}
          </label>
        ))}
      </form>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={() => setCurrentQuestionIndex((i) => i - 1)}
          disabled={currentQuestionIndex === 0}
          style={{
            padding: '10px 20px',
            borderRadius: 4,
            border: '1px solid #007bff',
            background: '#fff',
            color: '#007bff',
            cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        <button
          onClick={handleNextOrSubmit}
          disabled={selected === -1 || submitting}
          style={{
            padding: '10px 20px',
            borderRadius: 4,
            border: 'none',
            background: '#007bff',
            color: '#fff',
            cursor: selected === -1 || submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {currentQuestionIndex === questions.length - 1
            ? submitting
              ? 'Submitting...'
              : 'Submit'
            : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default QuizPage;
