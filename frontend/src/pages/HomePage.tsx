import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';

function HomePage() {
  const { login: setAuthToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token } = await login(email, password);
      setAuthToken(token);
      navigate('/profile'); // Redirect to profile on success
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      );
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <div style={{ fontSize: '100px', lineHeight: '1' }}>🧙</div>
      <h1>Welcome to Quizzard!</h1>
      <p>The ultimate quiz experience awaits you.</p>

      <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '10px', margin: '5px', width: '200px' }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', margin: '5px', width: '200px' }}
          />
        </div>
        <button
          type="submit"
          style={{ padding: '10px 20px', marginTop: '10px' }}
        >
          Login
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      <p style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default HomePage;
