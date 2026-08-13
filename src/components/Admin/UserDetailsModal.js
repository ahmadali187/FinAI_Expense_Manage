import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaWallet, FaExchangeAlt, FaBullseye, FaChartLine, FaHistory, FaPiggyBank, FaSyncAlt, FaExclamationCircle } from 'react-icons/fa';
import * as api from '../../services/api';

const UserDetailsModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('summary');
  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.getAdminUserDetail(userId);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load complete user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [userId]);

  if (!userId) return null;

  const filteredTransactions = data?.transactions?.filter(t => {
    if (!txSearch) return true;
    const q = txSearch.toLowerCase();
    return (
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q) ||
      String(t.amount).includes(q)
    )
  }) || [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem' }}>
              {data?.user?.name ? data.user.name[0].toUpperCase() : <FaUser />}
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
                {data?.user?.name || `User #${userId}`}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>ID: #{data?.user?.id}</span>
                <span>•</span>
                <span>{data?.user?.email}</span>
                <span>•</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', background: data?.user?.role === 'admin' ? '#3730a3' : '#1e293b', color: data?.user?.role === 'admin' ? '#a5b4fc' : '#94a3b8', fontWeight: 700 }}>
                  {data?.user?.role?.toUpperCase() || 'USER'}
                </span>
                <span>•</span>
                <span style={{ color: data?.user?.is_active ? '#34d399' : '#fca5a5', fontWeight: 600 }}>
                  {data?.user?.is_active ? 'Active' : 'Deactivated'}
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#fff' }}>
            <FaSyncAlt className="fa-spin" size={32} color="#6366f1" />
            <p style={{ marginTop: '14px', color: '#94a3b8' }}>Fetching complete user profile & financial records...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', color: '#fca5a5', textAlign: 'center' }}>
            <FaExclamationCircle size={36} color="#ef4444" />
            <p style={{ marginTop: '12px' }}>{error}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            
            {/* Sub-Navigation Tabs */}
            <div style={{ padding: '0 24px', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {[
                { id: 'summary', label: 'Financial Summary', icon: <FaChartLine /> },
                { id: 'transactions', label: `Transactions (${data.transactions.length})`, icon: <FaExchangeAlt /> },
                { id: 'accounts', label: `Accounts (${data.accounts.length})`, icon: <FaWallet /> },
                { id: 'budgets', label: `Budgets (${data.budgets.length})`, icon: <FaBullseye /> },
                { id: 'goals', label: `Goals (${data.goals.length})`, icon: <FaPiggyBank /> },
                { id: 'activity', label: 'Activity Logs', icon: <FaHistory /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    padding: '12px 14px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeSubTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                    color: activeSubTab === tab.id ? '#ffffff' : '#94a3b8',
                    fontWeight: activeSubTab === tab.id ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-Tab Contents */}
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

              {/* SUMMARY TAB */}
              {activeSubTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div className="glass-card" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Income</span>
                      <h3 style={{ margin: '4px 0 0 0', color: '#10b981', fontSize: '1.4rem' }}>₹{data.summary.total_income.toLocaleString()}</h3>
                    </div>

                    <div className="glass-card" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Expenses</span>
                      <h3 style={{ margin: '4px 0 0 0', color: '#ef4444', fontSize: '1.4rem' }}>₹{data.summary.total_expenses.toLocaleString()}</h3>
                    </div>

                    <div className="glass-card" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Net Cashflow</span>
                      <h3 style={{ margin: '4px 0 0 0', color: data.summary.net_cashflow >= 0 ? '#34d399' : '#fca5a5', fontSize: '1.4rem' }}>
                        ₹{data.summary.net_cashflow.toLocaleString()}
                      </h3>
                    </div>

                    <div className="glass-card" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Estimated Net Worth</span>
                      <h3 style={{ margin: '4px 0 0 0', color: '#818cf8', fontSize: '1.4rem' }}>₹{data.summary.net_worth.toLocaleString()}</h3>
                    </div>
                  </div>

                  <div className="glass-card">
                    <h4 style={{ margin: '0 0 14px 0', color: '#fff' }}>User Statistics Overview</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                      <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Accounts</span>
                        <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{data.summary.total_accounts}</strong>
                      </div>
                      <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Transactions</span>
                        <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{data.summary.total_transactions}</strong>
                      </div>
                      <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Budgets</span>
                        <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{data.summary.total_budgets}</strong>
                      </div>
                      <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Savings Goals</span>
                        <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{data.summary.total_goals}</strong>
                      </div>
                      <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '10px', borderRadius: '8px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Subscriptions</span>
                        <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{data.summary.total_subscriptions}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSACTIONS TAB */}
              {activeSubTab === 'transactions' && (
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <input
                      type="text"
                      placeholder="Search user's transactions by description, category, or amount..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 14px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                          <th style={{ padding: '8px' }}>Date</th>
                          <th style={{ padding: '8px' }}>Type</th>
                          <th style={{ padding: '8px' }}>Category</th>
                          <th style={{ padding: '8px' }}>Description</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map(t => (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1' }}>
                            <td style={{ padding: '8px' }}>{t.date}</td>
                            <td style={{ padding: '8px' }}>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: t.type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: t.type === 'income' ? '#34d399' : '#fca5a5' }}>
                                {t.type.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '8px' }}>{t.category}</td>
                            <td style={{ padding: '8px', color: '#fff' }}>{t.description}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#ef4444' }}>
                              {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ACCOUNTS TAB */}
              {activeSubTab === 'accounts' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                  {data.accounts.map(acc => (
                    <div key={acc.id} className="glass-card" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>{acc.type}</span>
                      <h4 style={{ margin: '4px 0 0 0', color: '#fff' }}>{acc.name}</h4>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', marginTop: '8px', display: 'block' }}>
                        ₹{(acc.current_balance || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* BUDGETS TAB */}
              {activeSubTab === 'budgets' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                  {data.budgets.map(b => (
                    <div key={b.id} className="glass-card" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.category}</span>
                      <h4 style={{ margin: '4px 0 0 0', color: '#fff' }}>Limit: ₹{b.amount.toLocaleString()}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px', display: 'block' }}>Period: {b.period || 'monthly'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* GOALS TAB */}
              {activeSubTab === 'goals' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                  {data.goals.map(g => (
                    <div key={g.id} className="glass-card" style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0', color: '#fff' }}>{g.title}</h4>
                      <span style={{ fontSize: '0.85rem', color: '#818cf8', display: 'block', marginTop: '4px' }}>
                        Target: ₹{g.target_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTIVITY TAB */}
              {activeSubTab === 'activity' && (
                <div>
                  {data.activity.map(act => (
                    <div key={act.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <span>{act.action}</span>
                      <span style={{ color: '#94a3b8' }}>{act.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailsModal;
