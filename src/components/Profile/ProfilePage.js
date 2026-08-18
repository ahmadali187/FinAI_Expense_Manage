import React, { useState, useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import * as api from '../../services/api';
import { FaLock, FaCheckCircle, FaShieldAlt, FaKey } from 'react-icons/fa';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const ProfilePage = () => {
  const { loggedInUser } = useContext(UserContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: '#64748b' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 25, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score: 70, label: 'Medium', color: '#f59e0b' };
    return { score: 100, label: 'Strong', color: '#10b981' };
  };

  const strength = calculatePasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.changePassword(currentPassword, newPassword);
      setSuccessMsg(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMsg(error.message || 'Failed to update security password.');
    } finally {
      setLoading(false);
    }
  };

  if (!loggedInUser) {
    return (
      <Card style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
        <p>Please log in to view your profile.</p>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
          User Profile & Security
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
          Manage your personal identity credentials and application security settings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Account Information Card */}
        <Card title="Account Details">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.6rem',
              fontWeight: 800
            }}>
              {(loggedInUser.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                {loggedInUser.name}
              </h3>
              <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
                {loggedInUser.email}
              </span>
              <div style={{ marginTop: '6px' }}>
                <Badge variant={loggedInUser.role === 'admin' ? 'warning' : 'info'}>
                  {loggedInUser.role ? loggedInUser.role.toUpperCase() : 'USER'}
                </Badge>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94a3b8' }}>Account Type:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>Standard FinAI Consumer</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94a3b8' }}>Email Status:</span>
              <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaCheckCircle size={12} /> Verified
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#94a3b8' }}>Security Level:</span>
              <span style={{ color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaShieldAlt size={12} /> JWT Encrypted
              </span>
            </div>
          </div>
        </Card>

        {/* Security / Password Change Card */}
        <Card title="Change Security Password">
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem', marginBottom: '16px' }}>
                {successMsg}
              </div>
            )}

            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              icon={FaLock}
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              required
              icon={FaKey}
            />

            {/* Password Strength Indicator */}
            {newPassword && (
              <div style={{ marginBottom: '14px', marginTop: '-4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Password Strength:</span>
                  <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${strength.score}%`, background: strength.color, transition: 'all 0.3s ease' }} />
                </div>
              </div>
            )}

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              icon={FaKey}
            />

            <div style={{ marginTop: '20px' }}>
              <Button
                variant="primary"
                type="submit"
                fullWidth
                loading={loading}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>

      </div>

      {/* Data Export & Danger Zone */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Data Export */}
        <Card title="Data Backup & Export">
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '16px' }}>
            Download a full archive of your transactions, accounts, categories, and goals in standard CSV or JSON format. Excludes security keys and credentials.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const txs = await api.getTransactions();
                  const accs = await api.getAccounts();
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ transactions: txs, accounts: accs }, null, 2));
                  const dlAnchor = document.createElement('a');
                  dlAnchor.setAttribute("href", dataStr);
                  dlAnchor.setAttribute("download", `FinAI_Data_Backup_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(dlAnchor);
                  dlAnchor.click();
                  dlAnchor.remove();
                } catch (err) {
                  console.error("Export JSON failed:", err);
                }
              }}
            >
              Export JSON Backup
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card title="Danger Zone">
          <p style={{ fontSize: '0.88rem', color: '#f87171', marginBottom: '16px' }}>
            Permanently delete your user account and purge all linked financial transactions, accounts, and settings. This operation is irreversible.
          </p>
          <Button
            variant="outline"
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
            onClick={async () => {
              const confirmText = prompt('Type DELETE to permanently erase your account and all financial data:');
              if (confirmText === 'DELETE') {
                try {
                  await api.deleteUserAccount();
                  localStorage.clear();
                  window.location.href = '/login';
                } catch (err) {
                  alert(err.message || 'Failed to delete account.');
                }
              }
            }}
          >
            Permanently Delete Account
          </Button>
        </Card>
      </div>

    </div>
  );
};

export default ProfilePage;