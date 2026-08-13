import React, { useState, useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import * as api from '../../services/api';
import Alert from '../common/Alert';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './ProfilePage.css';

const ProfilePage = () => {
  const { loggedInUser } = useContext(UserContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPasswordInput, setShowCurrentPasswordInput] = useState(false);
  const [showNewPasswordInput, setShowNewPasswordInput] = useState(false);
  const [showConfirmPasswordInput, setShowConfirmPasswordInput] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', content: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', content: 'New password must be at least 6 characters long.' });
      return;
    }

    try {
      if (!loggedInUser) {
        setMessage({ type: 'error', content: 'You must be logged in to change your password.' });
        return;
      }

      const res = await api.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', content: res.message || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ type: 'error', content: error.message || 'An error occurred while changing password.' });
    }
  };

  if (!loggedInUser) {
    return <div className="glass-card"><p>Please log in to view your profile.</p></div>;
  }

  return (
    <div className="profile-page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <FaUser color="var(--primary-glow)" size={24} />
        <h2 style={{ margin: 0 }}>User Profile</h2>
      </div>

      {message.content && <Alert type={message.type} message={message.content} />}
      
      <div className="profile-info">
        <p><strong>Name:</strong> {loggedInUser.name}</p>
        <p><strong>Email:</strong> {loggedInUser.email}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <strong>Password:</strong> <span>{showPassword ? loggedInUser.password : '••••••••'}</span>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="btn-glass-secondary"
            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="password-change-form">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FaLock color="var(--primary-glow)" />
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Change Security Password</h3>
        </div>

        <div className="form-group">
          <label htmlFor="currentPassword">Current Password:</label>
          <div className="password-input-container">
            <input
              type={showCurrentPasswordInput ? "text" : "password"}
              id="currentPassword"
              className="glass-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPasswordInput(!showCurrentPasswordInput)}
              className="password-toggle-btn"
            >
              {showCurrentPasswordInput ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password:</label>
          <div className="password-input-container">
            <input
              type={showNewPasswordInput ? "text" : "password"}
              id="newPassword"
              className="glass-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPasswordInput(!showNewPasswordInput)}
              className="password-toggle-btn"
            >
              {showNewPasswordInput ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <div className="password-input-container">
            <input
              type={showConfirmPasswordInput ? "text" : "password"}
              id="confirmPassword"
              className="glass-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPasswordInput(!showConfirmPasswordInput)}
              className="password-toggle-btn"
            >
              {showConfirmPasswordInput ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-gradient-primary" style={{ width: '100%', marginTop: '14px' }}>
          Update Password
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;