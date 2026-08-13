import React, { useState, useEffect, useContext, useCallback } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import { FaWallet, FaUniversity, FaCreditCard, FaMoneyBillWave, FaPlus } from 'react-icons/fa';

const AccountsPage = () => {
  const { formatAmount } = useContext(CurrencyContext);
  const [accounts, setAccounts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !balance) return;

    try {
      setLoading(true);
      await api.addAccount({
        name,
        type,
        opening_balance: parseFloat(balance),
        current_balance: parseFloat(balance)
      });
      setName('');
      setBalance('');
      setShowAddForm(false);
      fetchAccounts();
    } catch (err) {
      console.error('Error adding account:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAccountIcon = (accType) => {
    switch (accType) {
      case 'Bank': return <FaUniversity color="#6366f1" size={24} />;
      case 'Credit Card': return <FaCreditCard color="#ef4444" size={24} />;
      case 'Cash': return <FaMoneyBillWave color="#10b981" size={24} />;
      default: return <FaWallet color="#3b82f6" size={24} />;
    }
  };

  const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-gradient" style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>
            Accounts & Wallets
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage your bank accounts, credit cards, UPI, and cash balances in SQLite.
          </p>
        </div>

        <button
          className="btn-gradient-primary"
          onClick={() => setShowAddForm(prev => !prev)}
        >
          <FaPlus /> {showAddForm ? 'Close Form' : 'Add New Account'}
        </button>
      </div>

      {/* Summary Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase' }}>Combined Account Liquidity</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>{formatAmount(totalBalance)}</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total active accounts: {accounts.length}</div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.85)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Account Name</label>
            <input
              type="text"
              className="glass-input"
              style={{ background: '#1e293b', color: '#fff' }}
              placeholder="e.g. HDFC Bank, SBI Savings"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Account Type</label>
            <select
              className="glass-input"
              style={{ background: '#1e293b', color: '#fff' }}
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="Bank">Bank Account</option>
              <option value="Savings">Savings Account</option>
              <option value="Cash">Cash Wallet</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="UPI">UPI Wallet</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Opening Balance (₹)</label>
            <input
              type="number"
              className="glass-input"
              style={{ background: '#1e293b', color: '#fff' }}
              placeholder="e.g. 25000"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              required
              step="0.01"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-gradient-primary" disabled={loading} style={{ width: '100%', padding: '10px' }}>
              {loading ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      )}

      {/* Account Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {accounts.map(acc => (
          <div key={acc.id} className="glass-card" style={{ borderLeft: `4px solid ${acc.type === 'Credit Card' ? '#ef4444' : '#6366f1'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getAccountIcon(acc.type)}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{acc.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{acc.type}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Current Balance</span>
              <strong style={{ fontSize: '1.5rem', color: acc.current_balance >= 0 ? '#10b981' : '#ef4444' }}>
                {formatAmount(acc.current_balance)}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountsPage;
