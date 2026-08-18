import React from 'react';

const Badge = ({ children, variant = 'info', size = 'md', className = '', style = {} }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
      case 'income':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'danger':
      case 'expense':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'warning':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'neutral':
        return { background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)' };
      case 'info':
      default:
        return { background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '2px 8px', fontSize: '0.7rem' };
      case 'lg':
        return { padding: '6px 14px', fontSize: '0.85rem' };
      case 'md':
      default:
        return { padding: '4px 10px', fontSize: '0.75rem' };
    }
  };

  return (
    <span
      className={`custom-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: '9999px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
