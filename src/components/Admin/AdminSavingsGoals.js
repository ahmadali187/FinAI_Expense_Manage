import React, { useState, useEffect } from 'react';
import { FaSearch, FaSyncAlt, FaPiggyBank, FaUser, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import * as api from '../../services/api';
import UserDetailsModal from './UserDetailsModal';

const AdminSavingsGoals = () => {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getAdminSavingsGoals({
        search,
        status: statusFilter,
        page,
        per_page: 25
      });
      setGoals(res.savings_goals || []);
      setSummary(res.summary || {});
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Admin savings goals fetch error:", err);
      setErrorMsg(err.message || "Failed to load database savings goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Savings Goals</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '1.4rem' }}>{summary.total_goals || 0} goals</h3>
          <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>Overall Completion: {summary.overall_progress || 0}%</span>
        </div>

        <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>Total Saved Amount</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#34d399', fontSize: '1.4rem' }}>₹{(summary.total_saved_amount || 0).toLocaleString()}</h3>
          <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Target: ₹{(summary.total_target_amount || 0).toLocaleString()}</span>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Completed Goals</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <FaCheckCircle color="#38bdf8" />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>{summary.completed_count || 0}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ border: summary.overdue_count > 0 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.8rem', color: summary.overdue_count > 0 ? '#fca5a5' : '#94a3b8' }}>Overdue Goals</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <FaExclamationTriangle color={summary.overdue_count > 0 ? '#ef4444' : '#94a3b8'} />
            <h3 style={{ margin: 0, color: summary.overdue_count > 0 ? '#fca5a5' : '#fff', fontSize: '1.4rem' }}>{summary.overdue_count || 0}</h3>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaPiggyBank color="#818cf8" size={22} />
              <h3 style={{ margin: 0, color: '#ffffff' }}>System Savings Goals ({total})</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Inspect real user savings goals, progress percentages, target dates, and overdue status stored in SQLite (`savings_goals` table).
            </p>
          </div>

          <button className="btn-glass-secondary" onClick={loadGoals} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSyncAlt className={loading ? 'fa-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search goal title, user name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Goals</option>
            <option value="completed">Completed Goals</option>
            <option value="overdue">Overdue Goals</option>
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
                <th style={{ padding: '10px' }}>Goal ID</th>
                <th style={{ padding: '10px' }}>Owner / User</th>
                <th style={{ padding: '10px' }}>Goal Title</th>
                <th style={{ padding: '10px' }}>Target Amount</th>
                <th style={{ padding: '10px' }}>Saved Amount</th>
                <th style={{ padding: '10px' }}>Remaining</th>
                <th style={{ padding: '10px', width: '140px' }}>Progress</th>
                <th style={{ padding: '10px' }}>Target Date</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {goals.length === 0 && !loading && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No savings goals found in the database.
                  </td>
                </tr>
              )}
              {goals.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '0.88rem' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: '#818cf8' }}>#{g.id}</td>
                  <td style={{ padding: '10px' }}>
                    <button
                      onClick={() => setSelectedUserId(g.user_id)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}
                    >
                      <FaUser size={12} /> {g.user_name}
                    </button>
                  </td>
                  <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{g.title}</td>
                  <td style={{ padding: '10px', color: '#fff' }}>₹{(g.target_amount || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px', color: '#34d399', fontWeight: 600 }}>₹{(g.current_amount || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px', color: '#cbd5e1' }}>₹{(g.remaining_amount || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${g.progress_percentage}%`, height: '100%', background: g.status === 'completed' ? '#34d399' : g.status === 'overdue' ? '#ef4444' : '#818cf8' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1', width: '32px' }}>{g.progress_percentage}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px', color: '#cbd5e1', fontSize: '0.82rem' }}>{g.target_date || 'N/A'}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: g.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : g.status === 'overdue' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)', color: g.status === 'completed' ? '#34d399' : g.status === 'overdue' ? '#fca5a5' : '#a5b4fc' }}>
                      {g.status ? g.status.toUpperCase() : 'ACTIVE'}
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

export default AdminSavingsGoals;
