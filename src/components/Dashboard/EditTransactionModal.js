import React, { useState, useEffect, useContext } from 'react';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { CategoriesContext } from '../../contexts/CategoriesContext';
import CustomSelect from '../common/CustomSelect';
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
  const categoriesCtx = useContext(CategoriesContext);

  const expenseCategories = categoriesCtx?.categories?.expense || ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Housing', 'Education', 'Travel', 'Farming', 'Other'];
  const incomeCategories = categoriesCtx?.categories?.income || ['Salary', 'Freelance', 'Business', 'Investments', 'Dividends', 'Gift', 'Bonus', 'Refund', 'Other'];

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || '');
      setAmount(transaction.amount ? transaction.amount.toString() : '');
      setType(transaction.type || 'expense');
      setCategory(transaction.category || '');
      setDate(transaction.date || '');
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!description || !amount || !category || !date) {
      setError('Please fill all required fields.');
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
      const res = await updateTransFromContext(transaction.id, updatedTransactionData);
      if (res) {
        if (onTransactionUpdated) onTransactionUpdated();
        onClose();
      } else {
        setError('Failed to update transaction.');
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
      setError(err.message || 'Failed to update transaction.');
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Description</label>
              <input
                type="text"
                className="glass-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Amount (₹)</label>
                <input
                  type="number"
                  className="glass-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  step="0.01"
                />
              </div>
              <CustomSelect
                label="Type"
                value={type}
                onChange={e => {
                  const newType = e.target.value;
                  setType(newType);
                  setCategory(newType === 'income' ? incomeCategories[0] : expenseCategories[0]);
                }}
                options={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' }
                ]}
              />
            </div>

            <CustomSelect
              label="Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={type === 'income' ? incomeCategories : expenseCategories}
            />

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Date</label>
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