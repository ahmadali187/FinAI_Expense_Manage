import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import {
  FaTachometerAlt, FaUsers, FaUserShield, FaWallet, FaExchangeAlt,
  FaPiggyBank, FaChartPie, FaChartLine, FaFileAlt, FaHistory,
  FaDatabase, FaHeartbeat, FaRobot, FaUser, FaSignOutAlt
} from 'react-icons/fa';

const AdminSidebar = ({ isOpen, onClose }) => {
  const { loggedInUser, logout } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    if (onClose) onClose();
  };

  const isActive = (path) => {
    if (path === '/admin' && (location.pathname === '/admin' || location.pathname === '/admin/')) return true;
    return location.pathname.startsWith(path) && path !== '/admin';
  };

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
      borderRight: '1px solid rgba(99, 102, 241, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)'
        }}>
          <FaUserShield size={20} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
            FINAI
          </h2>
          <span style={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            ADMINISTRATION
          </span>
        </div>
      </div>

      {/* Navigation Links List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* SECTION 1: OVERVIEW */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px 6px 10px' }}>
            OVERVIEW
          </div>
          <Link
            to="/admin"
            className={isActive('/admin') ? 'active-admin-nav' : 'admin-nav-item'}
            style={navItemStyle(isActive('/admin'))}
          >
            <FaTachometerAlt color={isActive('/admin') ? '#818cf8' : '#94a3b8'} /> Dashboard
          </Link>
        </div>

        {/* SECTION 2: MANAGEMENT */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px 6px 10px' }}>
            MANAGEMENT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <Link to="/admin/users" style={navItemStyle(isActive('/admin/users'))}>
              <FaUsers color={isActive('/admin/users') ? '#818cf8' : '#94a3b8'} /> Users
            </Link>
            <Link to="/admin/admins" style={navItemStyle(isActive('/admin/admins'))}>
              <FaUserShield color={isActive('/admin/admins') ? '#818cf8' : '#94a3b8'} /> Admins
            </Link>
            <Link to="/admin/accounts" style={navItemStyle(isActive('/admin/accounts'))}>
              <FaWallet color={isActive('/admin/accounts') ? '#38bdf8' : '#94a3b8'} /> Accounts
            </Link>
            <Link to="/admin/transactions" style={navItemStyle(isActive('/admin/transactions'))}>
              <FaExchangeAlt color={isActive('/admin/transactions') ? '#34d399' : '#94a3b8'} /> Transactions
            </Link>
            <Link to="/admin/savings-goals" style={navItemStyle(isActive('/admin/savings-goals'))}>
              <FaPiggyBank color={isActive('/admin/savings-goals') ? '#f472b6' : '#94a3b8'} /> Savings Goals
            </Link>
            <Link to="/admin/budgets" style={navItemStyle(isActive('/admin/budgets'))}>
              <FaChartPie color={isActive('/admin/budgets') ? '#f59e0b' : '#94a3b8'} /> Budgets
            </Link>
          </div>
        </div>

        {/* SECTION 3: ANALYTICS */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px 6px 10px' }}>
            ANALYTICS
          </div>
          <Link to="/admin/analytics" style={navItemStyle(isActive('/admin/analytics'))}>
            <FaChartLine color={isActive('/admin/analytics') ? '#818cf8' : '#94a3b8'} /> Financial Analytics
          </Link>
        </div>

        {/* SECTION 4: REPORTING */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px 6px 10px' }}>
            REPORTING
          </div>
          <Link to="/admin/reports" style={navItemStyle(isActive('/admin/reports'))}>
            <FaFileAlt color={isActive('/admin/reports') ? '#38bdf8' : '#94a3b8'} /> Executive Reports
          </Link>
        </div>

        {/* SECTION 5: OPERATIONS */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px 6px 10px' }}>
            OPERATIONS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <Link to="/admin/audit" style={navItemStyle(isActive('/admin/audit'))}>
              <FaHistory color={isActive('/admin/audit') ? '#818cf8' : '#94a3b8'} /> Audit & Activity
            </Link>
            <Link to="/admin/database" style={navItemStyle(isActive('/admin/database'))}>
              <FaDatabase color={isActive('/admin/database') ? '#818cf8' : '#94a3b8'} /> Database Schema
            </Link>
            <Link to="/admin/health" style={navItemStyle(isActive('/admin/health'))}>
              <FaHeartbeat color={isActive('/admin/health') ? '#34d399' : '#94a3b8'} /> System Health
            </Link>
          </div>
        </div>

        {/* SECTION 6: AI */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px 6px 10px' }}>
            AI ASSISTANT
          </div>
          <Link to="/admin/copilot" style={navItemStyle(isActive('/admin/copilot'))}>
            <FaRobot color={isActive('/admin/copilot') ? '#f472b6' : '#94a3b8'} /> Admin Copilot
          </Link>
        </div>

        {/* SECTION 7: SYSTEM */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px 6px 10px' }}>
            SYSTEM
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <Link to="/admin/profile" style={navItemStyle(isActive('/admin/profile'))}>
              <FaUser color={isActive('/admin/profile') ? '#818cf8' : '#94a3b8'} /> Admin Profile
            </Link>
            <button
              onClick={handleLogout}
              style={{
                ...navItemStyle(false),
                background: 'transparent',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <FaSignOutAlt color="#ef4444" /> Logout
            </button>
          </div>
        </div>

      </div>

      {/* User Status Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 700 }}>
          {(loggedInUser?.name || 'A')[0]}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <span style={{ display: 'block', color: '#fff', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {loggedInUser?.name || 'Admin User'}
          </span>
          <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
            Superuser Admin
          </span>
        </div>
      </div>
    </aside>
  );
};

const navItemStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '9px 12px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: active ? 700 : 500,
  color: active ? '#ffffff' : '#94a3b8',
  background: active ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.35), rgba(147, 51, 234, 0.2))' : 'transparent',
  border: active ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
  textDecoration: 'none',
  transition: 'all 0.15s ease'
});

export default AdminSidebar;
