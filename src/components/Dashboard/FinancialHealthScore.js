import React, { useContext } from 'react';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { BudgetsContext } from '../../contexts/BudgetsContext';
import { FaHeartbeat, FaLightbulb } from 'react-icons/fa';

const FinancialHealthScore = () => {
  const { transactions } = useContext(TransactionsContext);
  const { budgets } = useContext(BudgetsContext);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Calculate Health Index (0 - 100)
  let score = 50; // base score
  if (totalIncome > 0) {
    const savingsRatio = ((totalIncome - totalExpense) / totalIncome) * 100;
    if (savingsRatio >= 40) score += 35;
    else if (savingsRatio >= 20) score += 25;
    else if (savingsRatio > 0) score += 10;
    else score -= 15;
  } else if (totalExpense > 0) {
    score = 25;
  }

  // Budget compliance score adjustment
  if (budgets.length > 0) {
    let overBudgetCount = 0;
    budgets.forEach(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      if (spent > b.amount) overBudgetCount++;
    });
    if (overBudgetCount === 0) score += 15;
    else score -= overBudgetCount * 8;
  }

  const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

  let statusColor = '#10b981'; // Green
  let statusText = 'Excellent Health';
  if (finalScore < 50) {
    statusColor = '#ef4444'; // Red
    statusText = 'Needs Attention';
  } else if (finalScore < 75) {
    statusColor = '#f59e0b'; // Yellow
    statusText = 'Good Balance';
  }

  const getAiRecommendation = () => {
    if (totalIncome === 0) return 'Add your monthly income to activate personalized FinAI savings algorithms.';
    if (totalExpense > totalIncome) return 'Warning: Expenses exceed income by ' + Math.abs(totalIncome - totalExpense).toLocaleString() + '. Trim non-essential shopping.';
    if (finalScore >= 80) return 'Outstanding liquidity! Consider investing 20% of net savings into index funds or high-yield wealth goals.';
    return 'Your savings rate is healthy. Setting 1 additional budget cap could boost your score above 85!';
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaHeartbeat size={20} color={statusColor} />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>FinAI Health Index</h3>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
          {statusText}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', alignItems: 'center' }}>
        {/* Score Ring */}
        <div style={{ position: 'relative', width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="110" height="110" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(128,128,128,0.2)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={statusColor}
              strokeWidth="10"
              strokeDasharray="314"
              strokeDashoffset={314 - (314 * finalScore) / 100}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary, #ffffff)', display: 'block', lineHeight: 1 }}>{finalScore}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>/ 100</span>
          </div>
        </div>

        {/* AI Advisory Tip */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
            <FaLightbulb /> AI Advisory Tip
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
            {getAiRecommendation()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthScore;
