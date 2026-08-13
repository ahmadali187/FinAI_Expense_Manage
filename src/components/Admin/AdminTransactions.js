import React, { useState, useEffect } from 'react';
import { FaSearch, FaSyncAlt, FaExchangeAlt, FaUser } from 'react-icons/fa';
import * as api from '../../services/api';
import UserDetailsModal from './UserDetailsModal';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getAdminTransactions({
        search,
        type: typeFilter,
        category: categoryFilter,
        start_date: startDate,
        end_date: endDate,
        page,
        per_page: 25
      });
      setTransactions(res.transactions || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Admin transactions fetch error:", err);
      setErrorMsg(err.message || "Failed to load database transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, categoryFilter, startDate, endDate, page]);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaExchangeAlt color="#818cf8" size={22} />
            <h3 style={{ margin: 0, color: '#ffffff' }}>System Transactions Log ({total})</h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
            Inspect real-time income and expense transactions across all users stored in SQLite (`transactions` table).
          </p>
        </div>

        <button className="btn-glass-secondary" onClick={loadTransactions} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaSyncAlt className={loading ? 'fa-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search description, merchant, category, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
        >
          <option value="">All Types</option>
          <option value="income">Income Only</option>
          <option value="expense">Expense Only</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
        />
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
              <th style={{ padding: '10px' }}>Tx ID</th>
              <th style={{ padding: '10px' }}>Date</th>
              <th style={{ padding: '10px' }}>User / Owner</th>
              <th style={{ padding: '10px' }}>Type</th>
              <th style={{ padding: '10px' }}>Category</th>
              <th style={{ padding: '10px' }}>Amount</th>
              <th style={{ padding: '10px' }}>Merchant</th>
              <th style={{ padding: '10px' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && !loading && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No database transactions found matching the filters.
                </td>
              </tr>
            )}
            {transactions.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '0.88rem' }}>
                <td style={{ padding: '10px', fontWeight: 700, color: '#818cf8' }}>#{t.id}</td>
                <td style={{ padding: '10px', color: '#cbd5e1', fontSize: '0.82rem' }}>{t.date}</td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => setSelectedUserId(t.user_id)}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}
                  >
                    <FaUser size={12} /> {t.user_name}
                  </button>
                </td>
                <td style={{ padding: '10px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: t.type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: t.type === 'income' ? '#34d399' : '#fca5a5' }}>
                    {t.type ? t.type.toUpperCase() : 'EXPENSE'}
                  </span>
                </td>
                <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{t.category}</td>
                <td style={{ padding: '10px', fontWeight: 700, color: t.type === 'income' ? '#34d399' : '#fca5a5' }}>
                  {t.type === 'income' ? '+' : '-'}₹{roundVal(t.amount)}
                </td>
                <td style={{ padding: '10px', color: '#cbd5e1' }}>{t.merchant || 'N/A'}</td>
                <td style={{ padding: '10px', color: '#cbd5e1' }}>{t.description || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUserId && <UserDetailsModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
    </div>
  );
};

const roundVal = (v) => {
  return (v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default AdminTransactions;
