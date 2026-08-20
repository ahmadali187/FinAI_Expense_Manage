import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { FaHome, FaWallet, FaPlus, FaRobot, FaChartBar, FaSignOutAlt } from 'react-icons/fa';

const MobileNavbar = ({ onOpenQuickAdd }) => {
  const { logout } = useContext(UserContext);

  const itemStyle = (isActive) => ({
    flex: '1 1 0%',
    minWidth: 0,
    height: '100%',
    color: isActive ? '#818cf8' : '#94a3b8',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    fontSize: '0.65rem',
    fontWeight: isActive ? 700 : 500,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 0'
  });

  const labelStyle = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    lineHeight: 1
  };

  return (
    <div
      className="mobile-bottom-navbar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9000,
        paddingLeft: '4px',
        paddingRight: '4px',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom, 4px))',
        boxSizing: 'border-box',
        width: '100%'
      }}
    >
      <NavLink to="/dashboard" style={({ isActive }) => itemStyle(isActive)}>
        <FaHome size={17} />
        <span style={labelStyle}>Home</span>
      </NavLink>

      <NavLink to="/accounts" style={({ isActive }) => itemStyle(isActive)}>
        <FaWallet size={17} />
        <span style={labelStyle}>Accounts</span>
      </NavLink>

      <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', position: 'relative' }}>
        <button
          onClick={onOpenQuickAdd}
          aria-label="Add transaction"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.6)',
            cursor: 'pointer',
            flexShrink: 0,
            transform: 'translateY(-10px)',
            zIndex: 9001
          }}
        >
          <FaPlus size={18} />
        </button>
      </div>

      <NavLink to="/finai" style={({ isActive }) => itemStyle(isActive)}>
        <FaRobot size={17} />
        <span style={labelStyle}>FinAI</span>
      </NavLink>

      <NavLink to="/report" style={({ isActive }) => itemStyle(isActive)}>
        <FaChartBar size={17} />
        <span style={labelStyle}>Reports</span>
      </NavLink>

      <button onClick={logout} aria-label="Logout" style={itemStyle(false)}>
        <FaSignOutAlt size={17} color="#ef4444" />
        <span style={{ ...labelStyle, color: '#ef4444' }}>Logout</span>
      </button>
    </div>
  );
};

export default MobileNavbar;
