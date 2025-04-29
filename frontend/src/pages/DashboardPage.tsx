import './DashboardPage.css';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getToken } from '../utils/token';
import { API_URL } from '../config';

// User stats type
interface UserStats {
  mana: number;
  mageMeter: number;
}

function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  const [username, setUsername] = useState<string>('');
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Fetch user stats and username on mount
  useEffect(() => {
    const fetchStats = async () => {
      const token = getToken();
      if (!token) {
        setError('You are not logged in.');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch user stats');
        const data = await res.json();
        setStats({ mana: data.mana, mageMeter: data.mageMeter });
        setUsername(data.username || '');
      } catch {
        setError('Could not load stats.');
      }
    };
    fetchStats();
  }, []);

  // Show error or loading
  if (error)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>{error}</div>;
  if (!stats)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading...</div>;

  // Main dashboard UI
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {username && (
        <div className="dashboard-greeting">
          Hello, <span className="dashboard-username">{username}</span>!
        </div>
      )}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h2>🔮 Mana</h2>
          <p>{stats.mana}</p>
        </div>
        <div className="dashboard-card">
          <h2>⚡ Mage Meter</h2>
          <p>{Math.round(stats.mageMeter)}%</p>
        </div>
      </div>
      <div className="dashboard-links">
        <Link to="/quiz" className="dashboard-link">
          Start a Quiz
        </Link>
        <Link to="/leaderboard" className="dashboard-link">
          Leaderboard
        </Link>
        <Link to="/friends" className="dashboard-link">
          Manage Friends
        </Link>
        <Link to="/profile" className="dashboard-link">
          Edit Profile
        </Link>
      </div>
      <div className="dashboard-logout">
        <button onClick={handleLogout} className="dashboard-logout-button">
          Logout
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
