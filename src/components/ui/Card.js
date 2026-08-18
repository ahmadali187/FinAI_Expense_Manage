import React from 'react';

const Card = ({ children, title, subtitle, action, className = '', style = {}, headerStyle = {}, bodyStyle = {} }) => {
  return (
    <div
      className={`custom-card ${className}`}
      style={{
        background: 'var(--surface-glass, rgba(30, 41, 59, 0.65))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.1))',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-glass, 0 8px 24px rgba(0, 0, 0, 0.2))',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: 'var(--text-primary, #f8fafc)',
        ...style,
      }}
    >
      {(title || subtitle || action) && (
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            ...headerStyle,
          }}
        >
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
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
