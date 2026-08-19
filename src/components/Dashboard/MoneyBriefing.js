import React, { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import { FaSun, FaLightbulb } from 'react-icons/fa';

const MoneyBriefing = ({ dashboardData }) => {
  const { loggedInUser } = useContext(UserContext);
  const { formatAmount } = useContext(CurrencyContext);

  if (!dashboardData) return null;

  const {
    safe_to_spend = {},
    health = {},
    subscriptions = [],
    budgets = [],
    goals = []
  } = dashboardData;

  const currentBalance = safe_to_spend.current_balance || 0;
  const safeDaily = safe_to_spend.safe_to_spend_today || 0;
  const upcomingBills = subscriptions.filter(s => !s.is_paid);
  const totalBillsVal = upcomingBills.reduce((acc, s) => acc + s.amount, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const getTodayAttentionItem = () => {
    if (upcomingBills.length > 0) {
      return `Attention: ${upcomingBills[0].title} (${formatAmount(upcomingBills[0].amount)}) is due ${upcomingBills[0].due_date}.`;
    }
    if (health.score < 60) {
      return `Attention: Your Financial Health score is ${health.score}/100. Lower non-essential shopping to improve cashflow.`;
    }
    return `All good! You are staying within your safe spending limit of ${formatAmount(safeDaily)} per day.`;
  };

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: '16px',
        padding: '24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaSun size={24} color="#fbbf24" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
              {greeting}, {loggedInUser?.name || 'User'}!
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', fontWeight: 700 }}>TODAY'S MONEY BRIEFING & AI ADVISORY</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent, #818cf8)', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 700 }}>
            Health Index: {health.score || 85}/100
          </span>
        </div>
      </div>

      {/* 8 Core Answers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--surface-glass, rgba(30, 41, 59, 0.6))', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--surface-glass-border, rgba(255,255,255,0.08))' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'block', fontWeight: 600 }}>1. Available Balance</span>
          <strong style={{ fontSize: '1.2rem', color: currentBalance >= 0 ? 'var(--success-text, #10b981)' : 'var(--danger-text, #ef4444)' }}>{formatAmount(currentBalance)}</strong>
        </div>

        <div style={{ background: 'var(--surface-glass, rgba(30, 41, 59, 0.6))', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--surface-glass-border, rgba(255,255,255,0.08))' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'block', fontWeight: 600 }}>2. Safe to Spend Today</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--success-text, #10b981)' }}>{formatAmount(safeDaily)} / day</strong>
        </div>

        <div style={{ background: 'var(--surface-glass, rgba(30, 41, 59, 0.6))', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--surface-glass-border, rgba(255,255,255,0.08))' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'block', fontWeight: 600 }}>3. Upcoming Bills</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--warning-text, #f59e0b)' }}>{formatAmount(totalBillsVal)} ({upcomingBills.length} bills)</strong>
        </div>

        <div style={{ background: 'var(--surface-glass, rgba(30, 41, 59, 0.6))', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--surface-glass-border, rgba(255,255,255,0.08))' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'block', fontWeight: 600 }}>4. Active Goals & Caps</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--accent, #818cf8)' }}>{goals.length} Goals | {budgets.length} Caps</strong>
        </div>
      </div>

      {/* AI Attention Banner */}
      <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary, #ffffff)' }}>
        <FaLightbulb color="#d97706" size={18} />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>{getTodayAttentionItem()}</span>
      </div>
    </div>
  );
};

export default MoneyBriefing;
