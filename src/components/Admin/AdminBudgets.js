import React, { useState, useEffect } from 'react';
import { FaSearch, FaSyncAlt, FaChartPie, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import * as api from '../../services/api';
import UserDetailsModal from './UserDetailsModal';

const AdminBudgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [page] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getAdminBudgets({
        search,
        period: periodFilter,
        page,
        per_page: 25
      });
      setBudgets(res.budgets || []);
      setSummary(res.summary || {});
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Admin budgets fetch error:", err);
      setErrorMsg(err.message || "Failed to load database budgets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, periodFilter, page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Category Budgets</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '1.4rem' }}>{summary.total_budgets || 0} budgets</h3>
          <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>On Track: {summary.ontrack_count || 0}</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Total Allocated Limit</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#38bdf8', fontSize: '1.4rem' }}>₹{(summary.total_allocated || 0).toLocaleString()}</h3>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Total Spent in Budgets</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#ef4444', fontSize: '1.4rem' }}>₹{(summary.total_spent || 0).toLocaleString()}</h3>
        </div>

        <div className="glass-card" style={{ border: summary.exceeded_count > 0 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.8rem', color: summary.exceeded_count > 0 ? '#fca5a5' : '#94a3b8' }}>Exceeded Budgets</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <FaExclamationTriangle color={summary.exceeded_count > 0 ? '#ef4444' : '#94a3b8'} />
            <h3 style={{ margin: 0, color: summary.exceeded_count > 0 ? '#fca5a5' : '#fff', fontSize: '1.4rem' }}>{summary.exceeded_count || 0}</h3>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaChartPie color="#818cf8" size={22} />
              <h3 style={{ margin: 0, color: '#ffffff' }}>System Budgets & Expense Limits ({total})</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Inspect real category budgets, allocated amounts vs expense transaction totals stored in SQLite (`budgets` table).
            </p>
          </div>

          <button className="btn-glass-secondary" onClick={loadBudgets} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSyncAlt className={loading ? 'fa-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search category, user name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          >
            <option value="">All Periods</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="glass-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.85rem' }}>
                <th style={{ padding: '10px' }}>Budget ID</th>
                <th style={{ padding: '10px' }}>Owner / User</th>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>Allocated Limit</th>
                <th style={{ padding: '10px' }}>Spent Amount</th>
                <th style={{ padding: '10px' }}>Remaining</th>
                <th style={{ padding: '10px', width: '140px' }}>Usage</th>
                <th style={{ padding: '10px' }}>Period</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 && !loading && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No budgets found in the database.
                  </td>
                </tr>
              )}
              {budgets.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '0.88rem' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: '#818cf8' }}>#{b.id}</td>
                  <td style={{ padding: '10px' }}>
                    <button
                      onClick={() => setSelectedUserId(b.user_id)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}
                    >
                      <FaUser size={12} /> {b.user_name}
                    </button>
                  </td>
                  <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{b.category}</td>
                  <td style={{ padding: '10px', color: '#fff' }}>₹{(b.amount || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px', color: '#ef4444', fontWeight: 600 }}>₹{(b.used_amount || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px', color: (b.remaining_amount || 0) >= 0 ? '#34d399' : '#fca5a5' }}>₹{(b.remaining_amount || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(b.usage_percentage, 100)}%`, height: '100%', background: b.status === 'exceeded' ? '#ef4444' : b.status === 'warning' ? '#f59e0b' : '#34d399' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1', width: '32px' }}>{b.usage_percentage}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px', color: '#cbd5e1', fontSize: '0.82rem', textTransform: 'capitalize' }}>{b.period || 'Monthly'}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: b.status === 'exceeded' ? 'rgba(239, 68, 68, 0.2)' : b.status === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: b.status === 'exceeded' ? '#fca5a5' : b.status === 'warning' ? '#fcd34d' : '#34d399' }}>
                      {b.status === 'exceeded' ? 'EXCEEDED' : b.status === 'warning' ? 'WARNING' : 'ON TRACK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserId && <UserDetailsModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
    </div>
  );
};

export default AdminBudgets;
