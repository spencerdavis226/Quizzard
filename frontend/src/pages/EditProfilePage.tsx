import './EditProfilePage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, changePassword, deleteAccount } from '../api/user';

function EditProfilePage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [usernameMsg, setUsernameMsg] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUsernameMsg('');
    setLoading(true);
    try {
      await updateProfile({ username });
      setUsernameMsg('Username updated!');
    } catch (err) {
      setError((err as { message?: string })?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailMsg('');
    setLoading(true);
    try {
      await updateProfile({ email });
      setEmailMsg('Email updated!');
    } catch (err) {
      setError((err as { message?: string })?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordMsg('');
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(
        (err as { message?: string })?.message || 'Password change failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account? This cannot be undone.'
      )
    )
      return;
    setError('');
    setDeleting(true);
    try {
      await deleteAccount();
      // Optionally clear localStorage or auth token here
      navigate('/register');
    } catch (err) {
      setError(
        (err as { message?: string })?.message || 'Account deletion failed'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <h1>Edit Profile</h1>
      <form onSubmit={handleUsernameUpdate} className="edit-profile-form">
        <input
          type="text"
          placeholder="New Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="edit-profile-input"
        />
        <button
          type="submit"
          className="edit-profile-button"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Change Username'}
        </button>
        {usernameMsg && (
          <div className="edit-profile-success">{usernameMsg}</div>
        )}
      </form>
      <form onSubmit={handleEmailUpdate} className="edit-profile-form">
        <input
          type="email"
          placeholder="New Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="edit-profile-input"
        />
        <button
          type="submit"
          className="edit-profile-button"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Change Email'}
        </button>
        {emailMsg && <div className="edit-profile-success">{emailMsg}</div>}
      </form>
      <form onSubmit={handlePasswordChange} className="edit-profile-form">
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="edit-profile-input"
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="edit-profile-input"
        />
        <button
          type="submit"
          className="edit-profile-button"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Change Password'}
        </button>
        {passwordMsg && (
          <div className="edit-profile-success">{passwordMsg}</div>
        )}
      </form>
      <button
        onClick={handleDeleteAccount}
        className="edit-profile-delete"
        disabled={deleting}
      >
        {deleting ? 'Deleting...' : 'Delete Account'}
      </button>
      {error && <div className="edit-profile-error">{error}</div>}
      <button
        onClick={() => navigate('/dashboard')}
        className="edit-profile-back"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default EditProfilePage;
