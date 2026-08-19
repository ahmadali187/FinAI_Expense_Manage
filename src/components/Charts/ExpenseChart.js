import React, { useContext, useState } from 'react';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { CurrencyContext } from '../../contexts/CurrencyContext';

const ExpenseChart = () => {
  const { transactions } = useContext(TransactionsContext);
  const { formatAmount } = useContext(CurrencyContext);
  const [activeTab, setActiveTab] = useState('category');

  const categoryTotals = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(t.amount || 0);
    });

  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const categoryColors = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'
  ];

  const monthMap = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
    if (t.type === 'income') monthMap[key].income += parseFloat(t.amount || 0);
    if (t.type === 'expense') monthMap[key].expense += parseFloat(t.amount || 0);
  });

  const monthKeys = Object.keys(monthMap).slice(-6);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>Visual Financial Analytics</h3>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-glass, rgba(15, 23, 42, 0.5))', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setActiveTab('category')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'category' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
              color: activeTab === 'category' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'monthly' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
              color: activeTab === 'monthly' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Monthly Cashflow
          </button>
        </div>
      </div>

      {activeTab === 'category' ? (
        totalExpense > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(categoryTotals).map(([cat, val], idx) => {
              const pct = Math.round((val / totalExpense) * 100);
              const barColor = categoryColors[idx % categoryColors.length];
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                    <span>{cat}</span>
                    <span>{formatAmount(val)} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(128,128,128,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted, #cbd5e1)', padding: '24px' }}>No expenses recorded yet.</p>
        )
      ) : (
        monthKeys.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {monthKeys.map(mKey => {
              const data = monthMap[mKey];
              return (
                <div key={mKey} style={{ background: 'var(--surface-glass, rgba(255,255,255,0.03))', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-primary, #ffffff)' }}>{mKey}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                    <div style={{ color: '#10b981', fontWeight: 600 }}>Income: {formatAmount(data.income)}</div>
                    <div style={{ color: '#ef4444', fontWeight: 600 }}>Expense: {formatAmount(data.expense)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#cbd5e1', padding: '24px' }}>No transaction history available.</p>
        )
      )}
    </div>
  );
};

export default ExpenseChart;