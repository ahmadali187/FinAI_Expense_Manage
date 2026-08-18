import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginBottom: '12px', ...style }}>
      {label && (
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            color: 'var(--text-muted, #94a3b8)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 2
          }}>
            <Icon size={16} />
          </div>
        )}

        <input
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`custom-input ${className}`}
          style={{
            width: '100%',
            padding: '10px 14px',
            paddingLeft: Icon ? '38px' : '14px',
            paddingRight: isPassword ? '40px' : '14px',
            background: 'var(--surface-glass, rgba(15, 23, 42, 0.6))',
            border: error ? '1px solid #ef4444' : '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.12))',
            borderRadius: '8px',
            color: 'var(--text-primary, #f8fafc)',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              zIndex: 2
            }}
          >
            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
          </button>
        )}
      </div>

      {error && <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '2px' }}>{error}</span>}
      {!error && helperText && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>{helperText}</span>}
    </div>
  );
};

export default Input;
