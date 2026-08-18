import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import ModalPortal from '../common/ModalPortal';
import { addTransaction, getAccounts } from '../../services/api';

const AddTransactionModal = ({ isOpen, onClose, initialType = 'expense', onTransactionAdded }) => {
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

  const expenseCategories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Housing', 'Education', 'Travel', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investments', 'Dividends', 'Gift', 'Refund', 'Other'];

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
            setCategory('Food');
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
            setCategory('Salary');
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
          {/* Category */}
          <div>
            <label style={labelStyle}>
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                <option key={cat} value={cat} style={{ background: '#0f172a', color: '#ffffff' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label style={labelStyle}>
              Account / Wallet
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              style={inputStyle}
            >
              {accounts.length === 0 ? (
                <option value="" style={{ background: '#0f172a', color: '#ffffff' }}>No Accounts Available</option>
              ) : (
                accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {acc.name} ({acc.type}) — ₹{acc.current_balance?.toLocaleString('en-IN') || 0}
                  </option>
                ))
              )}
            </select>
          </div>
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
          <div>
            <label style={labelStyle}>
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={inputStyle}
            >
              <option value="UPI" style={{ background: '#0f172a', color: '#ffffff' }}>UPI / NetBanking</option>
              <option value="Debit Card" style={{ background: '#0f172a', color: '#ffffff' }}>Debit Card</option>
              <option value="Credit Card" style={{ background: '#0f172a', color: '#ffffff' }}>Credit Card</option>
              <option value="Cash" style={{ background: '#0f172a', color: '#ffffff' }}>Cash</option>
              <option value="Bank Transfer" style={{ background: '#0f172a', color: '#ffffff' }}>Bank Transfer</option>
              <option value="Other" style={{ background: '#0f172a', color: '#ffffff' }}>Other</option>
            </select>
          </div>
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

        {/* Submit Button */}
        <div style={{ paddingTop: '6px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: '#ffffff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: type === 'income' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: type === 'income' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              'Saving Record...'
            ) : (
              <>
                <FiCheck style={{ width: '18px', height: '18px' }} /> Save {type === 'income' ? 'Income' : 'Expense'}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalPortal>
  );
};

export default AddTransactionModal;
