import React, { useState, useContext } from 'react';
import { BudgetsContext } from '../../contexts/BudgetsContext';
import { UserContext } from '../../contexts/UserContext';
import { CategoriesContext } from '../../contexts/CategoriesContext';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as storageService from '../../utils/storageService';
import Alert from '../common/Alert';
import { FaPlus, FaTrash, FaChartPie, FaTimes } from 'react-icons/fa';

const BudgetManager = () => {
  const { budgets, addBudget: addBudgetToContext, deleteBudget: deleteBudgetFromContext } = useContext(BudgetsContext);
  const { loggedInUser } = useContext(UserContext);
  const { categories } = useContext(CategoriesContext);
  const { formatAmount } = useContext(CurrencyContext);

  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newBudgetPeriod, setNewBudgetPeriod] = useState('monthly');
  const [error, setError] = useState('');

  const currentUser = loggedInUser || storageService.getLoggedInUser();

  const budgetCategoryOptions = () => {
    let options = ['Overall'];
    if (categories && categories.expense) {
      options = [...options, ...categories.expense];
    }
    return [...new Set(options)];
  };

  const handleAddBudget = (e) => {
    e.preventDefault();
    setError('');
    if (!newBudgetCategory || !newBudgetAmount || !newBudgetPeriod) {
      setError('Please fill all fields.');
      return;
    }
    if (isNaN(parseFloat(newBudgetAmount)) || parseFloat(newBudgetAmount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const newBudgetData = {
      category: newBudgetCategory,
      amount: parseFloat(newBudgetAmount),
      period: newBudgetPeriod,
      createdAt: new Date().toISOString(),
    };

    try {
      if (!currentUser) {
        setError("You must be logged in to add a budget.");
        return;
      }
      if (addBudgetToContext(newBudgetData)) {
        setShowAddBudgetModal(false);
        setNewBudgetCategory('');
        setNewBudgetAmount('');
        setNewBudgetPeriod('monthly');
      } else {
        setError('Failed to save budget.');
      }
    } catch (err) {
      console.error("Error adding budget:", err);
      setError('Failed to save budget.');
    }
  };

  const handleDeleteBudget = (budgetId) => {
    try {
      if (!currentUser) {
        setError("You must be logged in to delete a budget.");
        return;
      }
      deleteBudgetFromContext(budgetId);
    } catch (err) {
      console.error("Error deleting budget:", err);
      setError('An error occurred while deleting the budget.');
    }
  };

  return (
    <div className="glass-card" style={{ background: 'rgba(30, 41, 59, 0.75)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaChartPie color="#6366f1" size={20} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>My Spending Budgets</h3>
        </div>
        <button
          className="btn-gradient-primary"
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#ffffff',
            fontWeight: 700,
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.5)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onClick={() => setShowAddBudgetModal(prev => !prev)}
        >
          <FaPlus /> {showAddBudgetModal ? 'Close Form' : 'Add Budget'}
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Expandable Inline Input Section */}
      {showAddBudgetModal && (
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.4)', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>Set Category Spending Limit</h4>
            <FaTimes style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowAddBudgetModal(false)} />
          </div>
          <form onSubmit={handleAddBudget} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Category</label>
              <select
                className="glass-input"
                style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                value={newBudgetCategory}
                onChange={e => setNewBudgetCategory(e.target.value)}
                required
              >
                <option value="" disabled>Select category</option>
                {budgetCategoryOptions().map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Limit Amount (₹)</label>
              <input
                type="number"
                className="glass-input"
                style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                value={newBudgetAmount}
                onChange={e => setNewBudgetAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
                step="0.01"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Period</label>
              <select
                className="glass-input"
                style={{ background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                value={newBudgetPeriod}
                onChange={e => setNewBudgetPeriod(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                className="btn-gradient-primary"
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#ffffff', fontWeight: 700, border: 'none' }}
              >
                Save Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {budgets && budgets.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Limit Amount</th>
                <th style={{ padding: '10px 12px' }}>Period</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(budget => (
                <tr key={budget.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#f8fafc' }}>{budget.category}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#818cf8' }}>{formatAmount(budget.amount)}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    {budget.period ? budget.period.charAt(0).toUpperCase() + budget.period.slice(1) : 'Monthly'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      className="btn-glass-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 500 }}>No spending limits set yet.</p>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>Click "+ Add Budget" above to set category caps.</span>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;