import React, { useState, useEffect } from 'react';
import { FaSearch, FaSyncAlt, FaWallet, FaUser } from 'react-icons/fa';
import * as api from '../../services/api';
import UserDetailsModal from './UserDetailsModal';

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getAdminAccounts({
        search,
        type: typeFilter,
        status: statusFilter,
        page,
        per_page: 25
      });
      setAccounts(res.accounts || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Admin accounts fetch error:", err);
      setErrorMsg(err.message || "Failed to load database accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, statusFilter, page]);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaWallet color="#818cf8" size={22} />
            <h3 style={{ margin: 0, color: '#ffffff' }}>System Registered Accounts ({total})</h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
            Inspect real user bank accounts, credit cards, UPI wallets, and current balances stored in SQLite (`accounts` table).
          </p>
        </div>

        <button className="btn-glass-secondary" onClick={loadAccounts} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaSyncAlt className={loading ? 'fa-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search account name, user name, or email..."
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
          <option value="">All Account Types</option>
          <option value="Bank">Bank Account</option>
          <option value="Savings">Savings</option>
          <option value="Cash">Cash Wallet</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="UPI">UPI Wallet</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active Accounts</option>
          <option value="inactive">Inactive Accounts</option>
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
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Owner / User</th>
              <th style={{ padding: '10px' }}>Account Name</th>
              <th style={{ padding: '10px' }}>Type</th>
              <th style={{ padding: '10px' }}>Current Balance</th>
              <th style={{ padding: '10px' }}>Opening Balance</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && !loading && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No database accounts found matching the criteria.
                </td>
              </tr>
            )}
            {accounts.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '0.88rem' }}>
                <td style={{ padding: '10px', fontWeight: 700, color: '#818cf8' }}>#{a.id}</td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => setSelectedUserId(a.user_id)}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}
                  >
                    <FaUser size={12} /> {a.user_name} ({a.user_email})
                  </button>
                </td>
                <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{a.name}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
                    {a.type}
                  </span>
                </td>
                <td style={{ padding: '10px', fontWeight: 700, color: (a.current_balance || 0) >= 0 ? '#34d399' : '#fca5a5' }}>
                  ₹{(a.current_balance || 0).toLocaleString()}
                </td>
                <td style={{ padding: '10px', color: '#94a3b8' }}>₹{(a.opening_balance || 0).toLocaleString()}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ color: a.is_active ? '#34d399' : '#fca5a5', fontWeight: 600, fontSize: '0.8rem' }}>
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem' }}>
                  {a.updated_at ? a.updated_at.split('T')[0] : 'N/A'}
                </td>
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

export default AdminAccounts;
