import React from 'react';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  style = {},
  placeholder = 'Select option...',
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginBottom: '12px', ...style }}>
      {label && (
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`custom-select ${className}`}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'var(--input-bg, rgba(15, 23, 42, 0.8))',
          border: error ? '1px solid #ef4444' : '1px solid var(--input-border, rgba(255, 255, 255, 0.12))',
          borderRadius: '8px',
          color: 'var(--text-primary, #f8fafc)',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s ease',
        }}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>

      {error && <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '2px' }}>{error}</span>}
      {!error && helperText && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>{helperText}</span>}
    </div>
  );
};

export default Select;
