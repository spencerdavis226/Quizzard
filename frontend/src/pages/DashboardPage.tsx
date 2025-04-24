import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getToken } from '../utils/token';

interface UserStats {
  mana: number;
  mageMeter: number;
}

function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    const fetchStats = async () => {
      const token = getToken();
      if (!token) {
        setError('You are not logged in.');
        return;
      }
      try {
        const res = await fetch('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch user stats');
        }
        const data = await res.json();
        setStats({
          mana: data.mana,
          mageMeter: data.mageMeter,
        });
      } catch {
        setError('Could not load stats.');
      }
    };
    fetchStats();
  }, []);

  if (error)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>{error}</div>;
  if (!stats)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Dashboard</h1>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            flex: '1 1 200px',
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          <h2>🔮 Mana</h2>
          <p>{stats.mana}</p>
        </div>
        <div
          style={{
            flex: '1 1 200px',
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          <h2>⚡ Mage Meter</h2>
          <p>{Math.round(stats.mageMeter)}%</p>
        </div>
      </div>

      <div
        style={{
          marginTop: '40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <Link
          to="/quiz-setup"
          style={{
            padding: '10px 20px',
            border: '1px solid #007BFF',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#007BFF',
          }}
        >
          Start a Quiz
        </Link>
        <Link
          to="/leaderboard"
          style={{
            padding: '10px 20px',
            border: '1px solid #007BFF',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#007BFF',
          }}
        >
          Leaderboard
        </Link>
        <Link
          to="/friends"
          style={{
            padding: '10px 20px',
            border: '1px solid #007BFF',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#007BFF',
          }}
        >
          Manage Friends
        </Link>
        <Link
          to="/profile"
          style={{
            padding: '10px 20px',
            border: '1px solid #007BFF',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#007BFF',
          }}
        >
          Edit Profile
        </Link>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            border: '1px solid #FF0000',
            borderRadius: '4px',
            backgroundColor: '#FF0000',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
