// Import dependencies and styles
import './LoginPage.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { login } from '../api/auth';

function LoginPage() {
  // State for form fields and UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Call the login API
      const data = await login(email, password);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage =
        (err as { message?: string })?.message || 'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render login form UI
  return (
    <div className="login-container">
      <div className="login-emoji">🧙‍♂️</div>
      <h1>Welcome to Quizzard!</h1>
      <p>The ultimate quiz experience awaits you.</p>
      <form onSubmit={handleLogin} className="login-form">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
        </div>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p className="login-error">{error}</p>}
      <p className="login-register-link">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default LoginPage;
