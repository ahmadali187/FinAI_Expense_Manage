import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { FaHome, FaWallet, FaPlus, FaRobot, FaChartBar, FaSignOutAlt } from 'react-icons/fa';

const MobileNavbar = ({ onOpenQuickAdd }) => {
  const { logout } = useContext(UserContext);

  return (
    <div className="mobile-bottom-navbar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '66px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justify: 'space-around',
      alignItems: 'center',
      zIndex: 9000,
      paddingLeft: '6px',
      paddingRight: '6px',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)'
    }}>
      <NavLink to="/dashboard" style={({ isActive }) => ({ color: isActive ? '#818cf8' : '#94a3b8', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 })}>
        <FaHome size={18} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/accounts" style={({ isActive }) => ({ color: isActive ? '#818cf8' : '#94a3b8', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 })}>
        <FaWallet size={18} />
        <span>Accounts</span>
      </NavLink>

      <button
        onClick={onOpenQuickAdd}
        aria-label="Add transaction"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          border: 'none',
          color: '#ffffff',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.6)',
          marginTop: '-18px',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        <FaPlus size={22} />
      </button>

      <NavLink to="/finai" style={({ isActive }) => ({ color: isActive ? '#818cf8' : '#94a3b8', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 })}>
        <FaRobot size={18} />
        <span>FinAI</span>
      </NavLink>

      <NavLink to="/report" style={({ isActive }) => ({ color: isActive ? '#818cf8' : '#94a3b8', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 })}>
        <FaChartBar size={18} />
        <span>Reports</span>
      </NavLink>

      <button
        onClick={logout}
        aria-label="Logout"
        style={{
          background: 'none',
          border: 'none',
          color: '#ef4444',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          fontSize: '0.68rem',
          cursor: 'pointer',
          padding: 0
        }}
      >
        <FaSignOutAlt size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default MobileNavbar;
