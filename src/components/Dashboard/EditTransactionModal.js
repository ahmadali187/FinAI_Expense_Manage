import React, { useState, useEffect, useContext } from 'react';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { CategoriesContext } from '../../contexts/CategoriesContext';
import Alert from '../common/Alert';
import { FaTimes, FaEdit } from 'react-icons/fa';

const EditTransactionModal = ({ transaction, onClose, onTransactionUpdated }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const { updateTransaction: updateTransFromContext } = useContext(TransactionsContext);
  const { categories } = useContext(CategoriesContext);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setCategory(transaction.category);
      setDate(transaction.date);
    }
  }, [transaction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!description || !amount || !category || !date) {
      setError('Please fill all fields.');
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const updatedTransactionData = {
      ...transaction,
      description,
      amount: parseFloat(amount),
      type,
      category,
      date,
    };

    try {
      if (updateTransFromContext(updatedTransactionData)) {
        onTransactionUpdated();
        onClose();
      } else {
        setError('Failed to update transaction.');
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
      setError('Failed to update transaction.');
    }
  };

  if (!transaction) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-glass-container" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaEdit color="var(--primary-glow)" size={18} />
            <h3 style={{ margin: 0, fontWeight: 700 }}>Edit Transaction</h3>
          </div>
          <FaTimes style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose} />
        </div>

        <div className="modal-body">
          {error && <Alert type="error" message={error} />}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Description</label>
              <input
                type="text"
                className="glass-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount (₹)</label>
                <input
                  type="number"
                  className="glass-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  step="0.01"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type</label>
                <select
                  className="glass-input"
                  value={type}
                  onChange={e => { setType(e.target.value); setCategory(''); }}
                >
                  <option value="expense" style={{ background: '#0f172a' }}>Expense</option>
                  <option value="income" style={{ background: '#0f172a' }}>Income</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category</label>
              <select
                className="glass-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="" disabled>Select category</option>
                {categories && categories[type] && categories[type].map(cat => (
                  <option key={cat} value={cat} style={{ background: '#0f172a' }}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</label>
              <input
                type="date"
                className="glass-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn-glass-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-gradient-primary">
                Update Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;