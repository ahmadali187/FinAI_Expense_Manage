import React, { useContext } from 'react';
import { FaExchangeAlt, FaTimes, FaCheck } from 'react-icons/fa';
import { CurrencyContext } from '../../contexts/CurrencyContext';

const CurrencyConverterModal = ({ isOpen, onClose }) => {
  const { currency, changeCurrency, CURRENCIES } = useContext(CurrencyContext);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-glass-container" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaExchangeAlt color="var(--primary-glow)" size={18} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Select Display Currency</h3>
          </div>
          <FaTimes style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose} />
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.values(CURRENCIES).map(c => {
            const isSelected = currency.code === c.code;
            return (
              <div
                key={c.code}
                onClick={() => { changeCurrency(c.code); onClose(); }}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid var(--primary-glow)' : '1px solid var(--surface-glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-glow)', width: '30px' }}>
                    {c.symbol}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name} ({c.code})</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      1 USD = {c.rate} {c.code}
                    </div>
                  </div>
                </div>

                {isSelected && <FaCheck color="#10b981" size={16} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverterModal;
