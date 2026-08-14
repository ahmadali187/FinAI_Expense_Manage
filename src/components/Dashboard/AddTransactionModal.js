import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiCheck, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
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
  const [receiptRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      fetchAccounts();
    }
  }, [isOpen, initialType, fetchAccounts]);

  if (!isOpen) return null;

  const expenseCategories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Housing', 'Education', 'Travel', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investments', 'Dividends', 'Gift', 'Refund', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
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
        payment_method: paymentMethod,
        receipt_ref: receiptRef || null
      });

      if (onTransactionAdded) onTransactionAdded();
      onClose();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <FiX className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-4">
          {type === 'income' ? '+ Record Income' : '- Record Expense'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Type Selector Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('Food');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
              type === 'expense'
                ? 'bg-red-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FiMinusCircle /> Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('Salary');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FiPlusCircle /> Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-xl focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account / Wallet
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {accounts.length === 0 ? (
                  <option value="">No Accounts Available</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type}) — ₹{acc.current_balance?.toLocaleString('en-IN') || 0}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="UPI">UPI / NetBanking</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Description / Title
            </label>
            <input
              type="text"
              placeholder={type === 'income' ? 'e.g., Monthly Salary' : 'e.g., Grocery Shopping'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Payee / Merchant (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Amazon, Starbucks, HDFC Bank"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <FiCheck className="w-5 h-5" /> Save {type === 'income' ? 'Income' : 'Expense'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
