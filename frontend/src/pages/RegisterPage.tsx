// Import dependencies and styles
import './RegisterPage.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, login } from '../api/auth';

function RegisterPage() {
  // State for form fields and UI
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle register form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Register and log in the user
      await register(username, email, password);
      const data = await login(email, password);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage =
        (err as { message?: string })?.message || 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render register form UI
  return (
    <div className="register-container">
      <h1>Register</h1>
      <form onSubmit={handleRegister} className="register-form">
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="register-input"
            required
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="register-input"
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="register-input"
            required
          />
        </div>
        <button type="submit" className="register-button" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {error && <p className="register-error">{error}</p>}
      <p className="register-login-link">
        Already have an account? <Link to="/">Login here</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
