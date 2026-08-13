import React, { useState, useContext } from 'react';
import { CategoriesContext } from '../../contexts/CategoriesContext';
import { UserContext } from '../../contexts/UserContext';
import Alert from '../common/Alert';
import { FaPlus, FaTrash, FaTags } from 'react-icons/fa';

const CategoryManager = () => {
  const {
    categories,
    addExpenseCategory,
    addIncomeCategory,
    deleteExpenseCategory,
    deleteIncomeCategory
  } = useContext(CategoriesContext);
  const { loggedInUser } = useContext(UserContext);

  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddCategory = (type) => {
    setError('');
    setSuccess('');
    if (!loggedInUser) {
      setError("You must be logged in to manage categories.");
      return;
    }

    let added = false;
    if (type === 'expense') {
      if (!newExpenseCat.trim()) {
        setError("Expense category name cannot be empty.");
        return;
      }
      added = addExpenseCategory(newExpenseCat.trim());
      if (added) {
        setSuccess(`Expense category "${newExpenseCat.trim()}" added.`);
        setNewExpenseCat('');
      } else {
        setError(`Expense category "${newExpenseCat.trim()}" already exists.`);
      }
    } else if (type === 'income') {
      if (!newIncomeCat.trim()) {
        setError("Income category name cannot be empty.");
        return;
      }
      added = addIncomeCategory(newIncomeCat.trim());
      if (added) {
        setSuccess(`Income category "${newIncomeCat.trim()}" added.`);
        setNewIncomeCat('');
      } else {
        setError(`Income category "${newIncomeCat.trim()}" already exists.`);
      }
    }
  };

  const handleDeleteCategory = (type, categoryToDelete) => {
    setError('');
    setSuccess('');
    if (!loggedInUser) {
      setError("You must be logged in to manage categories.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the ${type} category "${categoryToDelete}"?`)) {
      let deleted = false;
      if (type === 'expense') {
        deleted = deleteExpenseCategory(categoryToDelete);
      } else if (type === 'income') {
        deleted = deleteIncomeCategory(categoryToDelete);
      }

      if (deleted) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} category "${categoryToDelete}" deleted.`);
      } else {
        setError(`Could not delete category "${categoryToDelete}".`);
      }
    }
  };

  if (!categories) {
    return <div className="glass-card"><p>Loading categories...</p></div>;
  }

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <FaTags color="var(--primary-glow)" size={20} />
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Manage Financial Categories</h3>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Expense Categories */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-glass-border)' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>Expense Categories</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {categories.expense && categories.expense.map(cat => (
              <div
                key={`exp-${cat}`}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--surface-glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                <span>{cat}</span>
                <button
                  className="btn-glass-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                  onClick={() => handleDeleteCategory('expense', cat)}
                  disabled={['Other'].includes(cat)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          {loggedInUser && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="glass-input"
                placeholder="New expense category"
                value={newExpenseCat}
                onChange={e => setNewExpenseCat(e.target.value)}
              />
              <button className="btn-gradient-primary" style={{ padding: '0 16px' }} onClick={() => handleAddCategory('expense')}>
                <FaPlus />
              </button>
            </div>
          )}
        </div>

        {/* Income Categories */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-glass-border)' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>Income Categories</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {categories.income && categories.income.map(cat => (
              <div
                key={`inc-${cat}`}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--surface-glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                <span>{cat}</span>
                <button
                  className="btn-glass-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                  onClick={() => handleDeleteCategory('income', cat)}
                  disabled={['Other'].includes(cat)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          {loggedInUser && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="glass-input"
                placeholder="New income category"
                value={newIncomeCat}
                onChange={e => setNewIncomeCat(e.target.value)}
              />
              <button className="btn-gradient-primary" style={{ padding: '0 16px' }} onClick={() => handleAddCategory('income')}>
                <FaPlus />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
