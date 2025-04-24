import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Quiz Setup</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStartQuiz();
        }}
        style={{ marginTop: '20px' }}
      >
        <div>
          <label>
            Category:
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '10px', margin: '5px', width: '200px' }}
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
              style={{ padding: '10px', margin: '5px', width: '200px' }}
            >
              <option value="">Any (Mixed)</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          style={{ padding: '10px 20px', marginTop: '10px' }}
        >
          Start Quiz
        </button>
      </form>
    </div>
  );
}

export default QuizSetupPage;
