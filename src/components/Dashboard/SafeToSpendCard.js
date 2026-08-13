import React, { useState, useContext } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import HowIsThisCalculatedModal from './HowIsThisCalculatedModal';
import { FaShieldAlt, FaCalendarDay, FaPiggyBank, FaReceipt, FaInfoCircle } from 'react-icons/fa';

const SafeToSpendCard = ({ safeToSpendData }) => {
  const { formatAmount } = useContext(CurrencyContext);
  const [showHowModal, setShowHowModal] = useState(false);

  if (!safeToSpendData) return null;

  const {
    safe_to_spend_today = 0,
    remaining_discretionary = 0,
    upcoming_bills = 0,
    planned_savings = 0,
    remaining_days = 30
  } = safeToSpendData;

  return (
    <div
      className="glass-card"
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
            <FaShieldAlt /> FinAI Safe-to-Spend Guidance
          </div>
          <h2 style={{ margin: '8px 0 4px 0', fontSize: '2.4rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
            {formatAmount(safe_to_spend_today)} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#a7f3d0' }}>/ day</span>
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
            Estimated safe discretionary limit for the next <strong>{remaining_days} days</strong>.
          </p>

          <button
            onClick={() => setShowHowModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#60a5fa',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '6px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FaInfoCircle /> [How is this calculated?]
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaReceipt size={10} color="#f59e0b" /> Bills
            </span>
            <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{formatAmount(upcoming_bills)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaPiggyBank size={10} color="#3b82f6" /> Savings
            </span>
            <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{formatAmount(planned_savings)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaCalendarDay size={10} color="#10b981" /> Fund
            </span>
            <strong style={{ fontSize: '0.9rem', color: '#10b981' }}>{formatAmount(remaining_discretionary)}</strong>
          </div>
        </div>
      </div>

      <HowIsThisCalculatedModal
        isOpen={showHowModal}
        onClose={() => setShowHowModal(false)}
        safeToSpendData={safeToSpendData}
      />
    </div>
  );
};

export default SafeToSpendCard;
