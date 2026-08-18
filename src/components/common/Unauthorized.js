import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';
import Button from '../ui/Button';

const Unauthorized = () => {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '480px',
        textAlign: 'center',
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        padding: '40px 30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <FaShieldAlt size={32} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px 0' }}>
          Access Restricted (403)
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          You do not have the required permissions to access this administrative control panel.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">
            Return to User Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
