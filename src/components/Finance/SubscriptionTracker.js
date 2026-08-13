import React, { useState, useEffect, useContext, useCallback } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import * as api from '../../services/api';
import { FaCalendarAlt, FaPlus, FaCheckCircle, FaTimes } from 'react-icons/fa';

const SubscriptionTracker = () => {
  const { formatAmount } = useContext(CurrencyContext);
  const { refreshTransactions } = useContext(TransactionsContext);

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSubscriptions();
      setSubscriptions(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleTogglePaid = async (id) => {
    try {
      await api.toggleSubscription(id);
      fetchSubscriptions();
      refreshTransactions();
    } catch (err) {
      console.error("Failed to toggle subscription:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteSubscription(id);
      fetchSubscriptions();
    } catch (err) {
      console.error("Failed to delete subscription:", err);
    }
  };

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    try {
      await api.addSubscription({
        title,
        amount: parseFloat(amount),
        dueDate,
        category: 'Streaming'
      });
      setTitle('');
      setAmount('');
      setDueDate('');
      setShowAddForm(false);
      fetchSubscriptions();
    } catch (err) {
      console.error("Failed to add subscription:", err);
    }
  };

  const totalMonthlySub = subscriptions.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

  return (
    <div className="glass-card" style={{ background: 'rgba(30, 41, 59, 0.75)', border: '1px solid rgba(255, 255, 255, 0.15)', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCalendarAlt size={20} color="#8b5cf6" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Recurring Subscriptions & Bills</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Monthly Commitment: <strong>{formatAmount(totalMonthlySub)}</strong></span>
          </div>
        </div>
        <button
          className="btn-gradient-primary"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          onClick={() => setShowAddForm(prev => !prev)}
        >
          <FaPlus /> {showAddForm ? 'Close' : 'Add Bill'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubscription} style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Title (e.g. Netflix)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <input
            type="number"
            className="glass-input"
            placeholder="Amount (₹)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            step="0.01"
          />
          <input
            type="text"
            className="glass-input"
            placeholder="Due (e.g. 15th)"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
          />
          <button type="submit" className="btn-gradient-primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
            Save Bill
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading subscriptions...</div>
      ) : subscriptions.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {subscriptions.map(sub => (
            <div
              key={sub.id}
              style={{
                background: sub.is_paid || sub.isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${sub.is_paid || sub.isPaid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                padding: '12px 14px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>{sub.title}</span>
                <button
                  onClick={() => handleDelete(sub.id)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  <FaTimes size={12} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#818cf8' }}>{formatAmount(sub.amount)}</span>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{sub.due_date || sub.dueDate}</span>
              </div>

              <button
                onClick={() => handleTogglePaid(sub.id)}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '8px',
                  border: 'none',
                  background: sub.is_paid || sub.isPaid ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}
              >
                <FaCheckCircle /> {(sub.is_paid || sub.isPaid) ? 'Paid' : 'Mark as Paid'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#cbd5e1', fontSize: '0.85rem' }}>
          No recurring subscriptions logged yet. Click "+ Add Bill" above.
        </div>
      )}
    </div>
  );
};

export default SubscriptionTracker;
