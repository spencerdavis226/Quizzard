import { useLocation, useNavigate } from 'react-router-dom';

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface ResultsState {
  mana: number;
  mageMeter: number;
  questions: Question[];
  userAnswers: number[];
}

const QuizResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mana, mageMeter, questions, userAnswers } = (location.state ||
    {}) as ResultsState;

  if (!questions || !userAnswers) {
    return (
      <div style={{ textAlign: 'center', marginTop: 50 }}>
        No results to display.
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 700,
        margin: '40px auto',
        padding: 20,
        border: '1px solid #ccc',
        borderRadius: 8,
        background: '#f9f9f9',
      }}
    >
      <h1 style={{ textAlign: 'center' }}>Quiz Results</h1>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 20 }}>
          🔮 Mana: <b>{mana}</b>
        </div>
        <div style={{ fontSize: 20 }}>
          ⚡ Mage Meter: <b>{Math.round(mageMeter)}%</b>
        </div>
      </div>
      <h2 style={{ marginBottom: 16 }}>Your Answers:</h2>
      <ol>
        {questions.map((q, idx) => {
          const userIdx = userAnswers[idx];
          const userAnswer = userIdx !== -1 ? q.options[userIdx] : 'No answer';
          const isCorrect = userAnswer === q.correct_answer;
          return (
            <li key={idx} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                {q.question}
              </div>
              <div>
                <span
                  style={{
                    color: isCorrect ? 'green' : 'red',
                    fontWeight: 600,
                  }}
                >
                  Your answer: {userAnswer}
                </span>
                {!isCorrect && (
                  <span style={{ marginLeft: 16, color: 'green' }}>
                    Correct answer: {q.correct_answer}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 28px',
            borderRadius: 4,
            border: 'none',
            background: '#007bff',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default QuizResultsPage;
