import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './QuizResultsPage.css';

// Define types for quiz data passed from QuizPage
interface Question {
  question: string;
  category: string;
  difficulty: string;
  options: string[];
  correct_answer: string;
}

interface Score {
  category: string;
  difficulty: string;
  questionCount: number;
  correctAnswers: number;
  percentage: number;
}

// Interface for the complete state passed from quiz page
interface ResultsState {
  mana?: number;
  mageMeter?: number;
  questions: Question[];
  userAnswers: number[];
  timedOutQuestions?: boolean[];
  score?: Score;
  error?: string; // Allow for error message to be passed from QuizPage
}

// Helper to capitalize first letter of each word
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Quiz results component to display summary and details of completed quiz
const QuizResultsPage: React.FC = () => {
  // Get navigation and location utilities
  const location = useLocation();
  const navigate = useNavigate();

  // Local state for storing computed score if there was an API submission error
  const [computedScore, setComputedScore] = React.useState<Score | null>(null);

  // Extract quiz results from location state
  const {
    mana,
    mageMeter,
    questions,
    userAnswers,
    timedOutQuestions = [],
    score,
    error: submitError,
  } = (location.state as ResultsState) || {};

  // Effect to calculate score locally if we received questions but submission failed
  React.useEffect(() => {
    // If we have questions and answers but no score (failed to submit), calculate locally
    if (questions?.length && userAnswers?.length && !score) {
      // Count correct answers
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (
          userAnswers[idx] !== -1 &&
          !timedOutQuestions[idx] &&
          q.options[userAnswers[idx]] === q.correct_answer
        ) {
          correctCount++;
        }
      });

      // Find the most common category for the summary
      const categoryCounts: Record<string, number> = {};
      questions.forEach((q) => {
        categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
      });

      let primaryCategory = 'Mixed Categories';
      let maxCount = 0;
      for (const [category, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryCategory = category;
        }
      }

      // Create local score object
      setComputedScore({
        category: primaryCategory,
        difficulty: 'Mixed', // We're using mixed difficulty levels
        questionCount: questions.length,
        correctAnswers: correctCount,
        percentage: Math.round((correctCount / questions.length) * 100),
      });
    }
  }, [questions, userAnswers, timedOutQuestions, score]);

  // Use the server score if available, otherwise fall back to computed score
  const displayScore = score || computedScore;

  // Handle missing quiz data (e.g., if user navigated directly to this page)
  if (!questions || !userAnswers) {
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

  // Calculate the performance grade based on percentage
  const getPerformanceGrade = (percentage: number): string => {
    if (percentage >= 90) return 'Archmage Level';
    if (percentage >= 80) return 'Master Wizard';
    if (percentage >= 70) return 'Adept Spellcaster';
    if (percentage >= 60) return 'Apprentice Mage';
    if (percentage >= 50) return 'Magic Novice';
    return 'Beginner Spellcaster';
  };

  // Generate a motivational message based on performance
  const getMotivationalMessage = (percentage: number): string => {
    if (percentage >= 80) {
      return 'Impressive magical knowledge! Your spellcasting skills are extraordinary.';
    } else if (percentage >= 60) {
      return 'Well done! Your magical abilities are growing stronger.';
    } else if (percentage >= 40) {
      return 'Keep practicing your spells. Your magical potential is there!';
    } else {
      return 'Every great wizard starts somewhere. Keep studying the magical arts!';
    }
  };

  // Count categories and difficulties for the summary section
  const getCategoryBreakdown = (): React.ReactElement => {
    const categories: Record<string, number> = {};
    questions.forEach((q) => {
      categories[q.category] = (categories[q.category] || 0) + 1;
    });

    return (
      <div className="breakdown">
        <p>
          <strong>Categories covered:</strong>
        </p>
        <ul className="breakdown-list">
          {Object.entries(categories).map(([category, count]) => (
            <li key={category}>
              {category}: {count} question{count !== 1 ? 's' : ''}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const getDifficultyBreakdown = (): React.ReactElement => {
    const difficulties: Record<string, number> = {};
    questions.forEach((q) => {
      difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1;
    });

    return (
      <div className="breakdown">
        <p>
          <strong>Difficulty breakdown:</strong>
        </p>
        <ul className="breakdown-list">
          {Object.entries(difficulties).map(([difficulty, count]) => (
            <li key={difficulty}>
              {capitalizeWords(difficulty)}: {count} question
              {count !== 1 ? 's' : ''}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Main render of results page
  return (
    <div className="results-container">
      <h1 className="results-title">Quiz Results</h1>

      {/* Show server error message if present */}
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

      {/* Performance summary section */}
      <div className="performance-summary">
        <h2 className="performance-grade">
          {displayScore && getPerformanceGrade(displayScore.percentage)}
        </h2>
        <p className="motivation-message">
          {displayScore && getMotivationalMessage(displayScore.percentage)}
        </p>
        <div className="stats-container">
          {/* Only show mana/mageMeter if server submission was successful */}
          {mana !== undefined && mageMeter !== undefined ? (
            <>
              <div className="stat-card">
                <div className="stat-title">🔮 Total Mana</div>
                <div className="stat-value">{mana}</div>
              </div>

              <div className="stat-card">
                <div className="stat-title">⚡ Mage Meter</div>
                <div className="stat-value">{Math.round(mageMeter)}%</div>
              </div>
            </>
          ) : (
            <div className="error-notice">
              <p>Stats not updated due to connection error.</p>
            </div>
          )}

          <div className="stat-card">
            <div className="stat-title">✨ Quiz Score</div>
            <div className="stat-value">
              {displayScore?.correctAnswers}/{displayScore?.questionCount} (
              {displayScore?.percentage}%)
            </div>
          </div>
        </div>
      </div>

      {/* Quiz metadata section */}
      <div className="metadata-section">
        <h3>Quiz Details</h3>

        {/* Main category (most common) */}
        <p>
          <strong>Primary Category:</strong> {displayScore?.category}
        </p>

        {/* Category breakdown */}
        {getCategoryBreakdown()}

        {/* Difficulty breakdown */}
        {getDifficultyBreakdown()}

        {/* Overall stats */}
        <p className="total-questions">
          <strong>Total Questions:</strong> {displayScore?.questionCount}
        </p>
        <p>
          <strong>Success Rate:</strong> {displayScore?.percentage}%
        </p>
      </div>

      {/* Questions and answers review section */}
      <h3>Review Your Answers</h3>
      <div className="answers-review">
        <ol>
          {questions.map((question, idx) => {
            // Get user's selected answer index
            const userAnswerIdx = userAnswers[idx];

            // Get the text of the user's answer
            const userAnswer =
              userAnswerIdx !== -1
                ? question.options[userAnswerIdx]
                : 'No answer';

            // Check if the user's answer is correct
            const isCorrect = userAnswer === question.correct_answer;

            return (
              <li
                key={idx}
                className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}
              >
                {/* Question metadata */}
                <div className="question-metadata">
                  <span>Category: {question.category}</span>
                  <span>
                    Difficulty: {capitalizeWords(question.difficulty)}
                  </span>
                </div>

                {/* Question text */}
                <div className="question-text">{question.question}</div>

                {/* User's answer */}
                <div className="user-answer">
                  <span className="answer-label">Your answer: </span>
                  <span
                    className={`answer-value ${
                      isCorrect ? 'correct-text' : 'incorrect-text'
                    }`}
                  >
                    {userAnswer}
                    {isCorrect ? ' ✓' : ' ✗'}
                  </span>
                </div>

                {/* Show correct answer if user was wrong */}
                {!isCorrect && (
                  <div className="correct-answer">
                    Correct answer: {question.correct_answer}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Navigation buttons */}
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
