import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGlobalLeaderboard, getFriendLeaderboard } from '../api/user';
import './LeaderboardPage.css';

interface LeaderboardUser {
  _id: string;
  username: string;
  mana: number;
  mageMeter: number;
  totalQuizzes?: number;
}

function LeaderboardPage() {
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'friends'>(
    'global'
  );
  const [sortBy, setSortBy] = useState<'mana' | 'mageMeter'>('mana');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const fetchFunction =
          leaderboardType === 'global'
            ? getGlobalLeaderboard
            : getFriendLeaderboard;
        const data = await fetchFunction(sortBy);
        setUsers(data.leaderboard || []);
      } catch (err) {
        setError(
          (err as { message?: string })?.message || 'Failed to load leaderboard'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [leaderboardType, sortBy]);

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard</h1>

      <div className="leaderboard-tabs">
        <button
          className={`leaderboard-tab ${
            leaderboardType === 'global' ? 'active' : ''
          }`}
          onClick={() => setLeaderboardType('global')}
        >
          Global
        </button>
        <button
          className={`leaderboard-tab ${
            leaderboardType === 'friends' ? 'active' : ''
          }`}
          onClick={() => setLeaderboardType('friends')}
        >
          Friends
        </button>
      </div>

      <div className="leaderboard-sorting">
        <span>Sort by:</span>
        <button
          className={`leaderboard-sort-btn ${
            sortBy === 'mana' ? 'active' : ''
          }`}
          onClick={() => setSortBy('mana')}
        >
          Mana
        </button>
        <button
          className={`leaderboard-sort-btn ${
            sortBy === 'mageMeter' ? 'active' : ''
          }`}
          onClick={() => setSortBy('mageMeter')}
        >
          Mage Meter
        </button>
      </div>

      {error && <div className="leaderboard-error">{error}</div>}

      {loading ? (
        <div className="leaderboard-loading">Loading...</div>
      ) : users.length === 0 ? (
        <div className="leaderboard-empty">
          {leaderboardType === 'friends'
            ? 'No friends found. Add friends to see them on the leaderboard!'
            : 'No users found.'}
        </div>
      ) : (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Mana</th>
                <th>Mage Meter</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id}>
                  <td>{index + 1}</td>
                  <td>{user.username}</td>
                  <td>{user.mana}</td>
                  <td>{Math.round(user.mageMeter)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={() => navigate('/dashboard')}
        className="leaderboard-back"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default LeaderboardPage;
