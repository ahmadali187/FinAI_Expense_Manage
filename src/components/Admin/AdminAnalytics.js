import React, { useState, useEffect } from 'react';
import { FaChartBar, FaCrown, FaDatabase, FaFilter, FaSyncAlt } from 'react-icons/fa';
import * as api from '../../services/api';

const DATE_FILTERS = [
  { id: '7days', label: '7 Days' },
  { id: '30days', label: '30 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all', label: 'All Time' }
];

const AdminAnalytics = () => {
  const [period, setPeriod] = useState('30days');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: '#fff' }}>
        <FaSyncAlt className="fa-spin" size={32} color="#6366f1" />
        <h3 style={{ marginTop: '16px' }}>Loading Admin Analytics & Visualizations...</h3>
      </div>
    );
  }

  const maxCatAmount = analytics?.top_categories?.length ? Math.max(...analytics.top_categories.map(c => c.amount)) : 1;
  const maxUserSpent = analytics?.top_spending_users?.length ? Math.max(...analytics.top_spending_users.map(u => u.total_spent)) : 1;
  const maxTableCount = analytics?.record_distribution?.length ? Math.max(...analytics.record_distribution.map(t => t.count)) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Date Range Filter Bar */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
          <FaFilter color="#818cf8" />
          <span style={{ fontWeight: 600, color: '#fff' }}>Analytics Range:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {DATE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setPeriod(f.id)}
              className={period === f.id ? 'btn-gradient-primary' : 'btn-glass-secondary'}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cashflow Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total System Income</span>
          <h3 style={{ margin: '6px 0 0 0', color: '#10b981', fontSize: '1.5rem' }}>
            ₹{(analytics?.income_vs_expense?.total_income || 0).toLocaleString()}
          </h3>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total System Expenses</span>
          <h3 style={{ margin: '6px 0 0 0', color: '#ef4444', fontSize: '1.5rem' }}>
            ₹{(analytics?.income_vs_expense?.total_expenses || 0).toLocaleString()}
          </h3>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Net System Cashflow</span>
          <h3 style={{ margin: '6px 0 0 0', color: (analytics?.income_vs_expense?.net_cashflow || 0) >= 0 ? '#34d399' : '#fca5a5', fontSize: '1.5rem' }}>
            ₹{(analytics?.income_vs_expense?.net_cashflow || 0).toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* CHART 1: TOP SPENDING CATEGORIES */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FaChartBar color="#818cf8" size={18} />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Top System Spending Categories</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics?.top_categories?.length ? analytics.top_categories.map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  <span>{cat.category}</span>
                  <span style={{ fontWeight: 700, color: '#a5b4fc' }}>₹{cat.amount.toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(cat.amount / maxCatAmount) * 100}%`,
                      background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            )) : <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No expense category data recorded.</p>}
          </div>
        </div>

        {/* CHART 2: TOP SPENDING USERS LEADERBOARD */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FaCrown color="#eab308" size={18} />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Top Spending Users Leaderboard (Admin Only)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics?.top_spending_users?.length ? analytics.top_spending_users.map((u, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  <span>#{u.user_id} {u.name} ({u.email})</span>
                  <span style={{ fontWeight: 700, color: '#fca5a5' }}>₹{u.total_spent.toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(u.total_spent / maxUserSpent) * 100}%`,
                      background: 'linear-gradient(90deg, #ef4444, #f87171)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            )) : <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No user spending leaderboard available.</p>}
          </div>
        </div>

        {/* CHART 3: DATABASE RECORD DISTRIBUTION */}
        <div className="glass-card" style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FaDatabase color="#10b981" size={18} />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Database Record Distribution</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics?.record_distribution?.length ? analytics.record_distribution.map((rec, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '4px' }}>
                  <span style={{ textTransform: 'capitalize' }}>{rec.table.replace('_', ' ')}</span>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>{rec.count} rows</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(rec.count / maxTableCount) * 100}%`,
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            )) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
