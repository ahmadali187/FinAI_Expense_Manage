import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, danger, outline, ghost, success
  size = 'md', // sm, md, lg
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  icon: Icon,
  className = '',
  style = {},
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          background: 'rgba(30, 41, 59, 0.8)',
          color: 'var(--text-primary, #f8fafc)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text-primary, #f8fafc)',
          border: '1px solid rgba(99, 102, 241, 0.5)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--text-secondary, #cbd5e1)',
          border: 'none',
        };
      case 'primary':
      default:
        return {
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' };
      case 'lg':
        return { padding: '14px 28px', fontSize: '1rem', borderRadius: '10px' };
      case 'md':
      default:
        return { padding: '10px 18px', fontSize: '0.9rem', borderRadius: '8px' };
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.65 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    userSelect: 'none',
    outline: 'none',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button
      type={type}
      style={baseStyle}
      disabled={disabled || loading}
      onClick={onClick}
      className={`custom-btn ${className}`}
      {...props}
    >
      {loading ? (
        <FaSpinner className="spin" style={{ animation: 'spin 1s linear infinite' }} />
      ) : Icon ? (
        <Icon />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
