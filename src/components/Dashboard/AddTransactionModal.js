import React, { useState, useEffect, useCallback, useContext } from 'react';
import { FiCheck, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import { FaWallet, FaPlus } from 'react-icons/fa';
import ModalPortal from '../common/ModalPortal';
import CustomSelect from '../common/CustomSelect';
import { CategoriesContext } from '../../contexts/CategoriesContext';
import { addTransaction, getAccounts, addAccount } from '../../services/api';

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

  // Account Prerequisite Inline State
  const [showInlineAddAccount, setShowInlineAddAccount] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('Bank Account');
  const [accBalance, setAccBalance] = useState('0');
  const [accLoading, setAccLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getAccounts();
      const list = Array.isArray(data) ? data : [];
      setAccounts(list);
      if (list.length > 0 && !accountId) {
        setAccountId(list[0].id);
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
      setShowInlineAddAccount(false);
      fetchAccounts();
    }
  }, [isOpen, initialType, fetchAccounts]);

  if (!isOpen) return null;

  const handleInlineAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accName.trim()) {
      setError('Please enter an account name.');
      return;
    }
    try {
      setAccLoading(true);
      setError('');
      const newAcc = await addAccount({
        name: accName.trim(),
        type: accType,
        opening_balance: parseFloat(accBalance || 0),
        color: '#4f46e5'
      });
      const updatedAccounts = await getAccounts();
      setAccounts(updatedAccounts || [newAcc]);
      setAccountId(newAcc.id || (updatedAccounts && updatedAccounts[0] ? updatedAccounts[0].id : ''));
      setShowInlineAddAccount(false);
      setAccName('');
      setAccBalance('0');
      window.dispatchEvent(new CustomEvent('accountMutated'));
    } catch (err) {
      console.error('Failed to create account:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setAccLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }

    try {
      setLoading(true);
      setError('');
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        account_id: accountId ? parseInt(accountId, 10) : (accounts[0] ? accounts[0].id : null),
        date,
        description: description || (type === 'income' ? `${category} Income` : `${category} Expense`),
        merchant: merchant || null,
        payment_method: paymentMethod
      });

      setSuccessMsg(`✓ ${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`);
      if (onTransactionAdded) onTransactionAdded();
      window.dispatchEvent(new CustomEvent('transactionMutated'));
      window.dispatchEvent(new CustomEvent('accountMutated'));
      
      setTimeout(() => {
        setAmount('');
        setDescription('');
        setMerchant('');
        onClose();
      }, 500);
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
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    color: 'var(--text-primary, #f8fafc)',
    fontSize: '0.92rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const categories = type === 'income' ? incomeCategories : expenseCategories;
  const categoryOptions = categories.map(c => ({ value: c, label: c }));
  const accountOptions = accounts.map(a => ({ value: a.id, label: `${a.name} (₹${(a.current_balance !== undefined ? a.current_balance : a.opening_balance).toLocaleString('en-IN')})` }));
  const paymentOptions = [
    { value: 'UPI', label: 'UPI / GPay / PhonePe' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Debit Card', label: 'Debit Card' },
    { value: 'Net Banking', label: 'Net Banking' }
  ];

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #ffffff)' }}>
          Record Transaction
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '1.4rem',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiCheck /> {successMsg}
        </div>
      )}

      {/* ACCOUNT PREREQUISITE SCREEN */}
      {accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
            <FaWallet size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: '0 0 6px 0' }}>
            Account Prerequisite Required
          </h3>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.88rem', margin: '0 0 18px 0', lineHeight: 1.5 }}>
            You need at least one bank account or cash wallet to track financial transactions. Create your first account to continue!
          </p>

          {showInlineAddAccount ? (
            <form onSubmit={handleInlineAccountSubmit} style={{ textAlign: 'left', background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Account Name *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, Cash Wallet"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Account Type</label>
                <CustomSelect
                  options={[
                    { value: 'Bank Account', label: 'Bank Account' },
                    { value: 'UPI Wallet', label: 'UPI / Wallet' },
                    { value: 'Cash Wallet', label: 'Cash Wallet' },
                    { value: 'Credit Card', label: 'Credit Card' }
                  ]}
                  value={accType}
                  onChange={setAccType}
                />
              </div>
              <div>
                <label style={labelStyle}>Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowInlineAddAccount(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'var(--text-primary, #fff)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accLoading}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f46e5, #9333ea)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  {accLoading ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowInlineAddAccount(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaPlus size={14} /> Create Your First Account
            </button>
          )}
        </div>
      ) : (
        /* STANDARD TRANSACTION FORM */
        <>
          {/* Type Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '18px'
          }}>
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
              <label style={labelStyle}>Amount (₹) *</label>
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

            {/* Account & Category Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Account *</label>
                <CustomSelect
                  options={accountOptions}
                  value={accountId}
                  onChange={setAccountId}
                  placeholder="Select Account"
                />
              </div>
              <div>
                <label style={labelStyle}>Category *</label>
                <CustomSelect
                  options={categoryOptions}
                  value={category}
                  onChange={setCategory}
                  placeholder="Select Category"
                />
              </div>
            </div>

            {/* Date & Payment Method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Payment Method</label>
                <CustomSelect
                  options={paymentOptions}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />
              </div>
            </div>

            {/* Merchant / Payee & Description */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Merchant / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy, Amazon"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description / Notes</label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: type === 'expense'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: type === 'expense'
                  ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                  : '0 4px 14px rgba(16, 185, 129, 0.4)',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Saving...' : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </form>
        </>
      )}
    </ModalPortal>
  );
};

export default AddTransactionModal;
