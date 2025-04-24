import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizSetupPage.css'; // Import the CSS file for styling

interface Category {
  id: number;
  name: string;
}

function QuizSetupPage() {
  const [categories, setCategories] = useState<Category[]>([]); // Explicitly typed
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://opentdb.com/api_category.php');
        const data = await response.json();
        setCategories(data.trivia_categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleStartQuiz = () => {
    navigate('/quiz', { state: { category, difficulty } });
  };

  return (
    <div className="quiz-setup-container">
      <h1>Quiz Setup</h1>
      <form
        className="quiz-setup-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleStartQuiz();
        }}
      >
        <div>
          <label>
            Category:
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Random Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Difficulty:
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">Any (Mixed)</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
        <button type="submit">Start Quiz</button>
      </form>
    </div>
  );
}

export default QuizSetupPage;
