import './QuizResultsPage.css';
import { useLocation, useNavigate } from 'react-router-dom';

// Quiz question type
interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

// Quiz score type
interface Score {
  questionCount: number;
  correctAnswers: number;
  percentage: number;
}

// Results state type
interface ResultsState {
  mana?: number;
  mageMeter?: number;
  questions: Question[];
  userAnswers: number[];
  score?: Score;
  error?: string;
}

// Decode HTML entities
function decodeHtml(html: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

const QuizResultsPage: React.FC = () => {
  // Get navigation and state
  const location = useLocation();
  const navigate = useNavigate();
  const {
    mana,
    mageMeter,
    questions = [],
    userAnswers = [],
    score,
    error: submitError,
  } = (location.state as ResultsState) || {};

  // Compute score if not provided
  const computedScore: Score = score || {
    questionCount: questions.length,
    correctAnswers: questions.reduce((acc, q, idx) => {
      if (
        userAnswers[idx] !== -1 &&
        q.options[userAnswers[idx]] === q.correct_answer
      ) {
        return acc + 1;
      }
      return acc;
    }, 0),
    percentage: questions.length
      ? Math.round(
          (questions.reduce((acc, q, idx) => {
            if (
              userAnswers[idx] !== -1 &&
              q.options[userAnswers[idx]] === q.correct_answer
            ) {
              return acc + 1;
            }
            return acc;
          }, 0) /
            questions.length) *
            100
        )
      : 0,
  };

  // Show error if no results
  if (!questions.length || !userAnswers.length) {
    return (
      <div className="error-container">
        <div className="error-emoji">🧙‍♂️</div>
        <h2>No quiz results to display</h2>
        <p>You need to complete a quiz before viewing results.</p>
        <button onClick={() => navigate('/quiz')} className="retry-button">
          Start a New Quiz
        </button>
      </div>
    );
  }

  // Main results UI
  return (
    <div className="results-container">
      <h1 className="results-title">Quiz Results</h1>
      {submitError && (
        <div className="error-message">
          <p>
            <strong>Note:</strong> {submitError}
          </p>
          <p className="error-detail">
            Your results are shown below but weren't saved to your profile.
          </p>
        </div>
      )}
      <div className="performance-summary">
        <h2 className="performance-grade">
          Score: {computedScore.correctAnswers} / {computedScore.questionCount}{' '}
          ({computedScore.percentage}%)
        </h2>
        {mana !== undefined && mageMeter !== undefined && (
          <div style={{ marginTop: 10 }}>
            <span>
              Mana: {mana} | Mage Meter: {mageMeter}%
            </span>
          </div>
        )}
      </div>
      <h3>Review Your Answers</h3>
      <div className="answers-review">
        <ol>
          {questions.map((question, idx) => {
            const userAnswerIdx = userAnswers[idx];
            const userAnswer =
              userAnswerIdx !== -1
                ? question.options[userAnswerIdx]
                : 'No answer';
            const isCorrect =
              userAnswerIdx !== -1 &&
              question.options[userAnswerIdx] === question.correct_answer;
            return (
              <li key={idx} className={isCorrect ? 'correct' : 'incorrect'}>
                <div className="question-text">
                  <strong>Q{idx + 1}:</strong> {decodeHtml(question.question)}
                </div>
                <div className="answer-row">
                  <span
                    className={`user-answer${
                      isCorrect
                        ? ' correct'
                        : userAnswerIdx !== -1
                        ? ' incorrect'
                        : ''
                    }`}
                  >
                    {userAnswerIdx !== -1
                      ? decodeHtml(userAnswer)
                      : 'No answer'}
                  </span>
                  {!isCorrect && (
                    <span className="correct-answer">
                      (Correct: {decodeHtml(question.correct_answer)})
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="navigation-buttons">
        <button
          onClick={() => navigate('/dashboard')}
          className="button-secondary"
        >
          Back to Dashboard
        </button>
        <button onClick={() => navigate('/quiz')} className="button-primary">
          New Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizResultsPage;
