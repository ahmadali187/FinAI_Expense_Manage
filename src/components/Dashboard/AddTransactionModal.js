import React, { useState, useEffect, useCallback, useContext } from 'react';
import { FiCheck, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import ModalPortal from '../common/ModalPortal';
import CustomSelect from '../common/CustomSelect';
import { CategoriesContext } from '../../contexts/CategoriesContext';
import { addTransaction, getAccounts } from '../../services/api';

const AddTransactionModal = ({ isOpen, onClose, initialType = 'expense', onTransactionAdded }) => {
  const categoriesCtx = useContext(CategoriesContext);
  const expenseCategories = categoriesCtx?.categories?.expense || ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Housing', 'Education', 'Travel', 'Farming', 'Other'];
  const incomeCategories = categoriesCtx?.categories?.income || ['Salary', 'Freelance', 'Business', 'Investments', 'Dividends', 'Gift', 'Bonus', 'Refund', 'Other'];

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(initialType === 'income' ? 'Salary' : 'Food');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getAccounts();
      setAccounts(data || []);
      if (data && data.length > 0 && !accountId) {
        setAccountId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  }, [accountId]);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setCategory(initialType === 'income' ? 'Salary' : 'Food');
      setSuccessMsg('');
      setError('');
      fetchAccounts();
    }
  }, [isOpen, initialType, fetchAccounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        account_id: accountId ? parseInt(accountId, 10) : null,
        date,
        description: description || (type === 'income' ? `${category} Income` : `${category} Expense`),
        merchant: merchant || null,
        payment_method: paymentMethod
      });

      setSuccessMsg(`✓ ${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`);
      if (onTransactionAdded) onTransactionAdded();
      
      setTimeout(() => {
        setAmount('');
        setDescription('');
        setMerchant('');
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-muted, #94a3b8)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const accountOptions = accounts.map(acc => ({
    value: String(acc.id),
    label: `${acc.name} (${acc.type}) — ₹${acc.current_balance?.toLocaleString('en-IN') || 0}`
  }));

  const paymentOptions = [
    { value: 'UPI', label: 'UPI / NetBanking' },
    { value: 'Debit Card', label: 'Debit Card' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <ModalPortal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={type === 'income' ? '+ Record Income' : '- Record Expense'}
      maxWidth="500px"
    >
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '10px', color: '#34d399', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FiCheck size={18} /> {successMsg}
        </div>
      )}

      {/* Type Selector Tabs */}
      <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', marginBottom: '20px', gap: '4px' }}>
        <button
          type="button"
          onClick={() => {
            setType('expense');
            setCategory(expenseCategories[0] || 'Food');
          }}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: type === 'expense' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
            color: type === 'expense' ? '#ffffff' : '#94a3b8',
            boxShadow: type === 'expense' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <FiMinusCircle /> Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setType('income');
            setCategory(incomeCategories[0] || 'Salary');
          }}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: type === 'income' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: type === 'income' ? '#ffffff' : '#94a3b8',
            boxShadow: type === 'income' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <FiPlusCircle /> Income
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Amount */}
        <div>
          <label style={labelStyle}>
            Amount (₹) *
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.2rem', fontWeight: 800 }}>₹</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{
                ...inputStyle,
                paddingLeft: '34px',
                fontSize: '1.2rem',
                fontWeight: 800
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Custom Category Dropdown */}
          <CustomSelect
            label="Category *"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={type === 'income' ? incomeCategories : expenseCategories}
          />

          {/* Account Dropdown */}
          <CustomSelect
            label="Account / Wallet"
            value={String(accountId)}
            onChange={(e) => setAccountId(e.target.value)}
            options={accountOptions.length > 0 ? accountOptions : [{ value: '', label: 'No Accounts Available' }]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Date */}
          <div>
            <label style={labelStyle}>
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Payment Method */}
          <CustomSelect
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={paymentOptions}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>
            Description / Title
          </label>
          <input
            type="text"
            placeholder={type === 'income' ? 'e.g., Monthly Salary' : 'e.g., Grocery Shopping'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Merchant */}
        <div>
          <label style={labelStyle}>
            Payee / Merchant (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., Amazon, Starbucks, HDFC Bank"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '10px',
              background: type === 'income' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: type === 'income' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(239, 68, 68, 0.4)'
            }}
          >
            {loading ? 'Saving Record...' : `✓ Save ${type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </div>
      </form>
    </ModalPortal>
  );
};

export default AddTransactionModal;
