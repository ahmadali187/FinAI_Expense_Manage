import React from 'react';

const Card = ({ children, title, subtitle, action, className = '', style = {}, headerStyle = {}, bodyStyle = {} }) => {
  return (
    <div
      className={`custom-card ${className}`}
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        ...style,
      }}
    >
      {(title || subtitle || action) && (
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            ...headerStyle,
          }}
        >
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: '22px', ...bodyStyle }}>{children}</div>
    </div>
  );
};

export default Card;
