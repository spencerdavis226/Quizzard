import './FriendsPage.css';
import { useEffect, useState } from 'react';
import { getFriends, addFriend, removeFriend } from '../api/user';
import { useNavigate } from 'react-router-dom';

interface Friend {
  _id: string;
  username: string;
  mana?: number;
  mageMeter?: number;
}

function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchFriends = async () => {
    setError('');
    try {
      const data = await getFriends();
      setFriends(data.friends || []);
    } catch (err) {
      setError(
        (err as { message?: string })?.message || 'Failed to load friends'
      );
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await addFriend(username);
      setSuccess('Friend added!');
      setUsername('');
      fetchFriends();
    } catch (err) {
      setError(
        (err as { message?: string })?.message || 'Failed to add friend'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (uname: string) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await removeFriend(uname);
      setSuccess('Friend removed.');
      fetchFriends();
    } catch (err) {
      setError(
        (err as { message?: string })?.message || 'Failed to remove friend'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="friends-container">
      <h1>Manage Friends</h1>
      <form onSubmit={handleAddFriend} className="friends-add-form">
        <input
          type="text"
          placeholder="Add friend by username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="friends-input"
          required
        />
        <button type="submit" className="friends-add-button" disabled={loading}>
          {loading ? 'Adding...' : 'Add Friend'}
        </button>
      </form>
      {success && <div className="friends-success">{success}</div>}
      {error && <div className="friends-error">{error}</div>}
      <div className="friends-list-section">
        <h2>Your Friends</h2>
        {friends.length === 0 ? (
          <div className="friends-empty">No friends yet.</div>
        ) : (
          <ul className="friends-list">
            {friends.map((friend) => (
              <li key={friend._id} className="friends-list-item">
                <span className="friends-username">{friend.username}</span>
                {friend.mana !== undefined &&
                  friend.mageMeter !== undefined && (
                    <span className="friends-stats">
                      Mana: {friend.mana} | Mage Meter:{' '}
                      {Math.round(friend.mageMeter)}%
                    </span>
                  )}
                <button
                  className="friends-remove-button"
                  onClick={() => handleRemoveFriend(friend.username)}
                  disabled={loading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={() => navigate('/dashboard')} className="friends-back">
        Back to Dashboard
      </button>
    </div>
  );
}

export default FriendsPage;
