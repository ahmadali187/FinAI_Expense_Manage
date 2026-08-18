import React, { useState, useEffect, useContext, useCallback } from 'react';
import { FaPiggyBank, FaPlus, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import * as api from '../../services/api';

const SavingsGoalsTracker = () => {
  const { formatAmount } = useContext(CurrencyContext);
  const { refreshTransactions } = useContext(TransactionsContext);

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSavingsGoals();
      setGoals(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!title || !target) return;

    try {
      await api.addSavingsGoal({
        title,
        targetAmount: parseFloat(target),
        currentAmount: parseFloat(current || 0),
        targetDate: targetDate || new Date().toISOString().split('T')[0]
      });
      setTitle('');
      setTarget('');
      setCurrent('');
      setTargetDate('');
      setShowAdd(false);
      fetchGoals();
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  };

  const handleDeposit = async (id) => {
    const amountStr = prompt('Enter deposit amount in ₹:');
    const amt = parseFloat(amountStr);
    if (!amt || isNaN(amt) || amt <= 0) return;

    try {
      await api.depositSavingsGoal(id, amt);
      fetchGoals();
      refreshTransactions();
    } catch (err) {
      console.error("Failed to deposit to savings goal:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this savings goal?')) {
      try {
        await api.deleteSavingsGoal(id);
        fetchGoals();
      } catch (err) {
        console.error("Failed to delete goal:", err);
      }
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaPiggyBank color="var(--primary-glow)" size={22} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Savings & Wealth Goals</h3>
        </div>
        <button className="btn-gradient-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={() => setShowAdd(!showAdd)}>
          <FaPlus /> {showAdd ? 'Close' : 'New Goal'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddGoal} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input className="glass-input" style={{ background: '#1e293b', color: '#fff' }} placeholder="Goal Title (e.g. New Laptop)" value={title} onChange={e => setTitle(e.target.value)} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input className="glass-input" style={{ background: '#1e293b', color: '#fff' }} type="number" placeholder="Target Amount (₹)" value={target} onChange={e => setTarget(e.target.value)} required step="0.01" />
            <input className="glass-input" style={{ background: '#1e293b', color: '#fff' }} type="number" placeholder="Initial Saved (₹)" value={current} onChange={e => setCurrent(e.target.value)} step="0.01" />
          </div>
          <input className="glass-input" style={{ background: '#1e293b', color: '#fff' }} type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          <button type="submit" className="btn-gradient-primary" style={{ marginTop: '6px' }}>Save Goal</button>
        </form>
      )}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading goals...</div>
      ) : goals.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {goals.map(g => {
            const targetAmt = parseFloat(g.target_amount || g.target || 1);
            const currentAmt = parseFloat(g.current_amount || g.current || 0);
            const percent = Math.min(100, Math.round((currentAmt / targetAmt) * 100));
            return (
              <div key={g.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-glass-border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700 }}>{g.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Date: {g.target_date || g.targetDate || 'Flexible'}</span>
                  </div>
                  <FaTrash style={{ cursor: 'pointer', color: '#ef4444', opacity: 0.7 }} onClick={() => handleDelete(g.id)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '12px 0 6px 0', fontWeight: 600 }}>
                  <span>{formatAmount(currentAmt)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Target: {formatAmount(targetAmt)}</span>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.5s ease' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: percent >= 100 ? '#10b981' : 'var(--primary-glow)' }}>
                    {percent}% Achieved {percent >= 100 && <FaCheckCircle color="#10b981" />}
                  </span>
                  <button className="btn-glass-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleDeposit(g.id)}>
                    + Add Deposit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 600 }}>No savings goals created yet.</p>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginTop: '4px', marginBottom: '12px' }}>Track progress toward a vacation, emergency fund, or major purchase.</span>
          <button className="btn-gradient-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowAdd(true)}>
            + Create Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default SavingsGoalsTracker;
