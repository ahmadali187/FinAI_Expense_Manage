import React, { useState, useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { FaUserShield, FaKey, FaLock, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import * as api from '../../services/api';

const AdminProfile = () => {
  const { loggedInUser } = useContext(UserContext);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.postAdminChangePassword(currentPassword, newPassword);
      if (res && res.success) {
        setSuccessMsg('✓ Admin password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.message || 'Failed to update password.');
      }
    } catch (err) {
      console.error("Change password error:", err);
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      
      {/* Identity Card */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <FaUserShield size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>{loggedInUser?.name || 'Superuser Administrator'}</h3>
            <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#3730a3', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', display: 'inline-block' }}>
              ADMINISTRATOR ROLE
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(30, 41, 59, 0.6)', padding: '10px 14px', borderRadius: '8px' }}>
            <FaEnvelope color="#818cf8" />
            <span>Email: <strong>{loggedInUser?.email || 'admin@example.com'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(30, 41, 59, 0.6)', padding: '10px 14px', borderRadius: '8px' }}>
            <FaLock color="#34d399" />
            <span>Authentication: <strong>JWT 256-bit Signature + Role Access Control</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(30, 41, 59, 0.6)', padding: '10px 14px', borderRadius: '8px' }}>
            <FaCalendarAlt color="#f472b6" />
            <span>Account ID: <strong>User #{loggedInUser?.id || 1}</strong></span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <FaKey color="#818cf8" size={20} />
          <h3 style={{ margin: 0, color: '#ffffff' }}>Admin Security & Change Password</h3>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {successMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>New Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <button
            type="submit"
            className="btn-gradient-primary"
            disabled={loading}
            style={{ width: '100%', padding: '10px', fontSize: '0.88rem', marginTop: '6px' }}
          >
            {loading ? 'Updating Password...' : 'Update Admin Password'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default AdminProfile;
