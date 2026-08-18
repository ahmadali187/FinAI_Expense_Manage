import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import Button from '../ui/Button';

const NotFound = () => {
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
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px 30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <FaExclamationTriangle size={32} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px 0' }}>
          Page Not Found (404)
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          The requested page could not be located. It may have been moved or the URL is incorrect.
        </p>
        <Link to="/">
          <Button variant="primary">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
