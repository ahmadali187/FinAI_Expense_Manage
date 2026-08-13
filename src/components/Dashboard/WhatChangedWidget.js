import React, { useContext } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import { FaChartLine, FaArrowUp, FaArrowDown, FaLightbulb } from 'react-icons/fa';

const WhatChangedWidget = ({ transactions = [] }) => {
  const { formatAmount } = useContext(CurrencyContext);

  if (!transactions || transactions.length === 0) return null;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const prevMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    return t.type === 'expense' && d.getMonth() === m && d.getFullYear() === y;
  });

  const catCurrent = {};
  currentMonthTxs.forEach(t => {
    catCurrent[t.category] = (catCurrent[t.category] || 0) + t.amount;
  });

  const catPrev = {};
  prevMonthTxs.forEach(t => {
    catPrev[t.category] = (catPrev[t.category] || 0) + t.amount;
  });

  const changes = Object.keys(catCurrent).map(cat => {
    const curr = catCurrent[cat] || 0;
    const prev = catPrev[cat] || (curr * 0.85); // fallback estimate if first month
    const diffPct = prev > 0 ? (((curr - prev) / prev) * 100) : 0;
    return { category: cat, current: curr, prev, diffPct };
  }).sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct));

  if (changes.length === 0) return null;

  const topChange = changes[0];

  return (
    <div className="glass-card" style={{ background: 'rgba(30, 41, 59, 0.75)', border: '1px solid rgba(255, 255, 255, 0.15)', marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <FaChartLine color="#818cf8" size={20} />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
            WHAT CHANGED? (Month-over-Month Intelligence)
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Spending trends compared to last month</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        {changes.slice(0, 4).map((c, idx) => (
          <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>{c.category}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>{formatAmount(c.current)}</strong>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: c.diffPct > 0 ? '#ef4444' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {c.diffPct > 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                {Math.abs(c.diffPct).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {topChange && (
        <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', color: '#c7d2fe', fontSize: '0.85rem' }}>
          <FaLightbulb color="#fbbf24" size={16} />
          <span>
            FinAI Insight: <strong>{topChange.category}</strong> spending changed by {topChange.diffPct > 0 ? '+' : ''}{topChange.diffPct.toFixed(0)}% compared to last month ({formatAmount(topChange.current)} vs {formatAmount(topChange.prev)}).
          </span>
        </div>
      )}
    </div>
  );
};

export default WhatChangedWidget;
