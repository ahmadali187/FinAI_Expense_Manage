import React, { useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { FaSearch, FaCheckCircle, FaSyncAlt, FaSignOutAlt, FaUser, FaFileImage, FaChevronRight } from 'react-icons/fa';
import * as api from '../../services/api';

const AdminTopbar = ({ onOpenSearch, onRefresh, healthData }) => {
  const { loggedInUser, logout } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Generate breadcrumb text from current path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSubRoute = pathParts.length > 1 ? pathParts[1] : 'overview';

  const routeTitles = {
    overview: 'Overview & Intelligence',
    users: 'User Management',
    admins: 'Administrator Control',
    accounts: 'System Bank Accounts',
    transactions: 'Financial Transactions',
    'savings-goals': 'Savings Goals Intelligence',
    budgets: 'Category Budgets & Expense Limits',
    analytics: 'Financial Analytics',
    reports: 'Executive Reports',
    audit: 'Audit & Activity Logs',
    database: 'SQLite Database Schema',
    health: 'Operational System Health',
    copilot: 'FinAI Admin Copilot',
    profile: 'Admin Security & Profile'
  };

  const titleText = routeTitles[currentSubRoute] || 'Overview & Intelligence';

  return (
    <header style={{
      height: '64px',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.98))',
      borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      backdropFilter: 'blur(12px)'
    }}>
      
      {/* Left Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Admin</span>
        <FaChevronRight size={10} color="#64748b" />
        <span style={{ color: '#ffffff', fontWeight: 700 }}>{titleText}</span>
      </div>

      {/* Center Search Input Trigger */}
      <div
        onClick={onOpenSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '10px',
          padding: '7px 16px',
          cursor: 'pointer',
          width: '320px',
          maxWidth: '100%'
        }}
      >
        <FaSearch color="#94a3b8" size={13} />
        <span style={{ color: '#94a3b8', fontSize: '0.82rem', flex: 1 }}>Search users, goals, accounts...</span>
        <kbd style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 6px', color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 700 }}>⌘K</kbd>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Live System Status Badge */}
        <Link
          to="/admin/health"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '20px',
            color: '#34d399',
            fontSize: '0.78rem',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          <FaCheckCircle size={12} />
          <span>Healthy ({healthData?.database?.query_latency_ms || 0.28}ms)</span>
        </Link>

        {/* Matplotlib Export Link */}
        <a
          href={api.getAdminReportDownloadUrl('financial')}
          target="_blank"
          rel="noreferrer"
          className="btn-glass-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', textDecoration: 'none', color: '#cbd5e1', padding: '6px 12px' }}
        >
          <FaFileImage color="#34d399" /> Export PNG
        </a>

        {/* Refresh Button */}
        <button className="btn-glass-secondary" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.78rem' }}>
          <FaSyncAlt /> Refresh
        </button>

        {/* Admin Profile Link */}
        <button
          className="btn-glass-secondary"
          onClick={() => navigate('/admin/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.78rem' }}
        >
          <FaUser color="#818cf8" /> {loggedInUser?.name ? loggedInUser.name.split(' ')[0] : 'Admin'}
        </button>

        {/* Logout */}
        <button
          className="btn-gradient-primary"
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', padding: '6px 12px', fontSize: '0.78rem' }}
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>

    </header>
  );
};

export default AdminTopbar;
