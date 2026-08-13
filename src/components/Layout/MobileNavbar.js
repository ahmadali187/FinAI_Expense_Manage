import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaWallet, FaPlusCircle, FaRobot, FaChartBar } from 'react-icons/fa';

const MobileNavbar = ({ onOpenQuickAdd, onOpenAi }) => {
  return (
    <div className="mobile-bottom-navbar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justify: 'space-around',
      alignItems: 'center',
      zIndex: 9000,
      padding: '0 10px'
    }}>
      <NavLink to="/dashboard" style={({ isActive }) => ({ color: isActive ? '#6366f1' : '#94a3b8', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem' })}>
        <FaHome size={18} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/accounts" style={({ isActive }) => ({ color: isActive ? '#6366f1' : '#94a3b8', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem' })}>
        <FaWallet size={18} />
        <span>Accounts</span>
      </NavLink>

      <button
        onClick={onOpenQuickAdd}
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          border: 'none',
          color: '#ffffff',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.6)',
          marginTop: '-15px',
          cursor: 'pointer'
        }}
      >
        <FaPlusCircle size={24} />
      </button>

      <button
        onClick={onOpenAi}
        style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem', cursor: 'pointer' }}
      >
        <FaRobot size={18} color="#8b5cf6" />
        <span>FinAI</span>
      </button>

      <NavLink to="/report" style={({ isActive }) => ({ color: isActive ? '#6366f1' : '#94a3b8', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem' })}>
        <FaChartBar size={18} />
        <span>Reports</span>
      </NavLink>
    </div>
  );
};

export default MobileNavbar;
