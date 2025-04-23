import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  mana: number;
  mageMeter: number;
  friends: string[];
}

function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) {
        navigate('/');
        return;
      }
      try {
        const res = await fetch('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        setProfile(data);
      } catch {
        setError('Could not load profile.');
      }
    };
    fetchProfile();
  }, [navigate]);

  if (error)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>{error}</div>;
  if (!profile)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading...</div>;

  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <h1>Welcome, {profile.username}!</h1>
      <p>Your email: {profile.email}</p>
      <p>Mana: {profile.mana}</p>
      <p>Mage Meter: {profile.mageMeter}</p>
      <p>Friends: {profile.friends.length}</p>
    </div>
  );
}

export default DashboardPage;
