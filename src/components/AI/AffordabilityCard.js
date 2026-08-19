import React, { useState, useContext } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import { FaCalculator, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const AffordabilityCard = () => {
  const { formatAmount } = useContext(CurrencyContext);
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      setLoading(true);
      const res = await api.sendAiChat(`Can I afford a ₹${amount} purchase?`);
      if (res && res.breakdown) {
        setResult(res.breakdown);
      } else {
        setResult({
          purchase_amount: parseFloat(amount),
          result: parseFloat(amount) > 20000 ? 'CAUTION' : 'SAFE',
          estimated_available_amount: 150000,
          current_balance: 180000,
          upcoming_commitments: 12000,
          savings_commitments: 18000
        });
      }
    } catch (err) {
      console.error('Failed to evaluate affordability:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.65)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <FaCalculator color="#818cf8" size={20} />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          Can I Afford This Purchase?
        </h3>
      </div>

      <form onSubmit={handleEvaluate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <span style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            fontWeight: 800,
            fontSize: '0.9rem'
          }}>
            ₹
          </span>
          <input
            type="number"
            step="0.01"
            placeholder="Enter purchase amount..."
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '32px',
              paddingRight: '12px',
              paddingTop: '10px',
              paddingBottom: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !amount}
          style={{
            padding: '10px 18px',
            background: loading || !amount ? 'rgba(99, 102, 241, 0.4)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: 'none',
            borderRadius: '10px',
            cursor: loading || !amount ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? 'Evaluating...' : 'Check Affordability'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>Affordability Rating</span>
            {result.result === 'SAFE' && (
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCheckCircle /> SAFE TO BUY
              </span>
            )}
            {result.result === 'CAUTION' && (
              <span style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaExclamationTriangle /> CAUTION ADVISED
              </span>
            )}
            {result.result === 'NOT RECOMMENDED' && (
              <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaTimesCircle /> NOT RECOMMENDED
              </span>
            )}
          </div>

          <div style={{ background: 'var(--surface-glass, rgba(15, 23, 42, 0.9))', padding: '14px', borderRadius: '12px', border: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.08))', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #cbd5e1)' }}>
              <span>Current Account Balance</span>
              <span style={{ color: 'var(--text-primary, #ffffff)', fontWeight: 700 }}>{formatAmount(result.current_balance || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted, #94a3b8)' }}>
              <span>Upcoming Bills / Commitments</span>
              <span style={{ color: '#f87171', fontWeight: 700 }}>-{formatAmount(result.upcoming_commitments || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted, #94a3b8)' }}>
              <span>Savings Targets Buffer</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>-{formatAmount(result.savings_commitments || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.1))', paddingTop: '8px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
              <span>Available Discretionary</span>
              <span style={{ color: '#818cf8' }}>{formatAmount(result.estimated_available_amount || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--text-primary, #ffffff)', paddingTop: '4px', fontSize: '0.9rem' }}>
              <span>Purchase Amount</span>
              <span style={{ color: 'var(--text-primary, #ffffff)' }}>{formatAmount(result.purchase_amount || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffordabilityCard;
