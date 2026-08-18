import React, { useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { FaChartLine, FaChartPie, FaCog, FaUser, FaSignOutAlt, FaRobot, FaSearch, FaWallet, FaUserShield } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, onOpenCmdPalette, onOpenAi }) => {
  const { loggedInUser, logout } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    if (onClose) onClose();
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <Link to="/" onClick={handleNavClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="FinAI Logo"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              objectFit: 'cover',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          />
          <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
            FinAI Expense
          </span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {loggedInUser ? (
          <>
            {loggedInUser.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin') ? 'active' : ''} onClick={handleNavClick} style={{ color: '#a5b4fc', fontWeight: 600 }}>
                <FaUserShield /> Admin Control
              </Link>
            )}
            <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''} onClick={handleNavClick}>
              <FaChartLine /> Dashboard
            </Link>
            <Link to="/accounts" className={isActive('/accounts') ? 'active' : ''} onClick={handleNavClick}>
              <FaWallet /> Accounts & Wallets
            </Link>
            <Link to="/report" className={isActive('/report') ? 'active' : ''} onClick={handleNavClick}>
              <FaChartPie /> Reports & Analytics
            </Link>
            <Link to="/settings" className={isActive('/settings') ? 'active' : ''} onClick={handleNavClick}>
              <FaCog /> Settings & Categories
            </Link>
            <Link to="/profile" className={isActive('/profile') ? 'active' : ''} onClick={handleNavClick}>
              <FaUser /> Profile
            </Link>

            <div style={{ padding: '16px 20px', marginTop: '10px' }}>
              <button
                className="btn-gradient-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => { onOpenAi(); if (onClose) onClose(); }}
              >
                <FaRobot /> FinAI Assistant
              </button>

              <button
                className="btn-glass-secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => { onOpenCmdPalette(); if (onClose) onClose(); }}
              >
                <FaSearch /> Search (Cmd+K)
              </button>
            </div>

            <button onClick={handleLogout} className="sidebar-logout" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
              <FaSignOutAlt /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive('/login') ? 'active' : ''} onClick={handleNavClick}>
              Login
            </Link>
            <Link to="/register" className={isActive('/register') ? 'active' : ''} onClick={handleNavClick}>
              Register
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;