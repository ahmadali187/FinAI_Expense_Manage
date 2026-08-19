import React, { useContext } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import { FaTimes, FaCalculator } from 'react-icons/fa';

const HowIsThisCalculatedModal = ({ isOpen, onClose, safeToSpendData }) => {
  const { formatAmount } = useContext(CurrencyContext);

  if (!isOpen || !safeToSpendData) return null;

  const { calculation_details = [], safe_to_spend_today = 0, remaining_days = 30 } = safeToSpendData;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-glass-container"
        style={{
          maxWidth: '500px',
          background: 'var(--surface-glass, #1e293b)',
          color: 'var(--text-primary, #ffffff)',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCalculator color="#10b981" size={20} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
              How Safe-to-Spend is Calculated
            </span>
          </div>
          <FaTimes style={{ cursor: 'pointer', color: 'var(--text-muted, #94a3b8)', fontSize: '1.2rem' }} onClick={onClose} />
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '16px', lineHeight: 1.4 }}>
          FinAI calculates your daily discretionary spending limit using live SQLite account balances, upcoming bills, and planned savings goals:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {calculation_details.map((item, idx) => (
            <div key={idx} style={{ background: 'var(--surface-glass-hover, rgba(30, 41, 59, 0.6))', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary, #e2e8f0)' }}>{item.label}</span>
              <strong style={{ fontSize: '0.9rem', color: item.sign === '-' ? 'var(--danger-text, #ef4444)' : 'var(--success-text, #10b981)' }}>
                {item.sign} {typeof item.amount === 'number' && item.sign !== '÷' ? formatAmount(item.amount) : item.amount}
              </strong>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--success-text, #10b981)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Resulting Daily Limit</span>
          <strong style={{ fontSize: '1.8rem', color: 'var(--success-text, #10b981)' }}>{formatAmount(safe_to_spend_today)} / day</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginTop: '2px' }}>
            Estimated over the next {remaining_days} days of the month.
          </span>
        </div>
      </div>
    </div>
  );
};

export default HowIsThisCalculatedModal;
