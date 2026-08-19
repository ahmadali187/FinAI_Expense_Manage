import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

const CustomSelect = ({ label, value, onChange, options = [], style = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => typeof opt === 'object' ? opt.value === value : opt === value);
  const selectedLabel = selectedOption
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : value;

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', width: '100%', ...style }} ref={dropdownRef}>
      {label && (
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--surface-glass, rgba(15, 23, 42, 0.7))',
          border: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.12))',
          borderRadius: '10px',
          color: 'var(--text-primary, #ffffff)',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.25)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-primary, #ffffff)' }}>{selectedLabel}</span>
        <FaChevronDown style={{ fontSize: '0.75rem', opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-primary, #ffffff)' }} />
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '6px',
          background: 'var(--surface-glass-hover, #1e293b)',
          border: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.15))',
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
          zIndex: 9999,
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '6px'
        }}>
          {options.map((opt, idx) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const isSelected = optVal === value;

            return (
              <div
                key={idx}
                onClick={() => handleSelect(optVal)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isSelected ? '#818cf8' : 'var(--text-primary, #ffffff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s ease'
                }}
              >
                <span style={{ color: isSelected ? '#818cf8' : 'var(--text-primary, #ffffff)' }}>{optLabel}</span>
                {isSelected && <FaCheck size={12} color="#818cf8" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
