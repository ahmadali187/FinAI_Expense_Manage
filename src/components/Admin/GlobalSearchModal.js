import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaUser, FaWallet, FaExchangeAlt, FaPiggyBank, FaChartPie } from 'react-icons/fa';
import * as api from '../../services/api';

const GlobalSearchModal = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], accounts: [], transactions: [], savings_goals: [], budgets: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open trigger handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ users: [], accounts: [], transactions: [], savings_goals: [], budgets: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.getAdminGlobalSearch(query);
        setResults(res || { users: [], accounts: [], transactions: [], savings_goals: [], budgets: [] });
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalHits = (results.users?.length || 0) + (results.accounts?.length || 0) + (results.transactions?.length || 0) + (results.savings_goals?.length || 0) + (results.budgets?.length || 0);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', paddingTop: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '640px', height: 'fit-content', maxHeight: '80vh', overflowY: 'auto', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '20px' }}>
        
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
          <FaSearch size={18} color="#818cf8" />
          <input
            type="text"
            autoFocus
            placeholder="Search users, accounts, transactions, savings goals, budgets... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '1.05rem', fontWeight: 500 }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <FaTimes size={18} />
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>Searching database...</div>}

        {!loading && query && totalHits === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.9rem' }}>
            No matching entity records found for "{query}".
          </div>
        )}

        {/* Results Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* USERS */}
          {results.users?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaUser size={12} /> Users ({results.users.length})
              </div>
              {results.users.map(u => (
                <div
                  key={u.id}
                  onClick={() => { onSelectResult('users', u); onClose(); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.5)', marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
                >
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{u.name} ({u.email})</span>
                  <span style={{ fontSize: '0.75rem', color: u.role === 'admin' ? '#a5b4fc' : '#94a3b8' }}>#{u.id} • {u.role.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}

          {/* ACCOUNTS */}
          {results.accounts?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaWallet size={12} /> Accounts ({results.accounts.length})
              </div>
              {results.accounts.map(a => (
                <div
                  key={a.id}
                  onClick={() => { onSelectResult('accounts', a); onClose(); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.5)', marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
                >
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{a.name} ({a.type})</span>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>₹{(a.current_balance || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* TRANSACTIONS */}
          {results.transactions?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaExchangeAlt size={12} /> Transactions ({results.transactions.length})
              </div>
              {results.transactions.map(t => (
                <div
                  key={t.id}
                  onClick={() => { onSelectResult('transactions', t); onClose(); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.5)', marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
                >
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>#{t.id} — {t.category} ({t.description || 'N/A'})</span>
                  <span style={{ fontSize: '0.75rem', color: t.type === 'income' ? '#34d399' : '#fca5a5', fontWeight: 700 }}>
                    {t.type === 'income' ? '+' : '-'}₹{(t.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* SAVINGS GOALS */}
          {results.savings_goals?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaPiggyBank size={12} /> Savings Goals ({results.savings_goals.length})
              </div>
              {results.savings_goals.map(g => (
                <div
                  key={g.id}
                  onClick={() => { onSelectResult('savings-goals', g); onClose(); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.5)', marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 114, 182, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
                >
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{g.title}</span>
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Saved: ₹{(g.current_amount || 0).toLocaleString()} / Target: ₹{(g.target_amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* BUDGETS */}
          {results.budgets?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaChartPie size={12} /> Budgets ({results.budgets.length})
              </div>
              {results.budgets.map(b => (
                <div
                  key={b.id}
                  onClick={() => { onSelectResult('budgets', b); onClose(); }}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.5)', marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
                >
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{b.category} ({b.period})</span>
                  <span style={{ fontSize: '0.75rem', color: '#fcd34d', fontWeight: 700 }}>Limit: ₹{(b.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default GlobalSearchModal;
