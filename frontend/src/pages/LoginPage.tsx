import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { login } from '../api/auth';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Call the login function from the API
      const data = await login(email, password); // Expected to return { token: string }
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

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <div style={{ fontSize: '100px', lineHeight: '1' }}>🧙‍♂️</div>
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
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', margin: '5px', width: '200px' }}
            required
          />
        </div>
        <button
          type="submit"
          style={{ padding: '10px 20px', marginTop: '10px' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      <p style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default LoginPage;
