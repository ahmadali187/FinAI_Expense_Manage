import React, { useState, useEffect, useContext, useCallback } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import { 
  FaWallet, FaUniversity, FaCreditCard, FaMoneyBillWave, FaPlus, 
  FaEdit, FaTrashAlt, FaArchive, FaUndo, FaPiggyBank, FaChartLine, FaLandmark, FaExchangeAlt, FaTimes, FaExclamationTriangle
} from 'react-icons/fa';

const AccountsPage = () => {
  const { formatAmount } = useContext(CurrencyContext);
  const [accounts, setAccounts] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState(null);
  
  // Safe Delete Modal State
  const [deleteConfirmAcc, setDeleteConfirmAcc] = useState(null);
  const [txCountNotice, setTxCountNotice] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank Account');
  const [institutionName, setInstitutionName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.getAccounts(showArchived);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const resetForm = () => {
    setName('');
    setType('Bank Account');
    setInstitutionName('');
    setLastFour('');
    setOpeningBalance('');
    setColor('#3B82F6');
    setNotes('');
    setEditingAcc(null);
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAcc(acc);
    setName(acc.name || '');
    setType(acc.type || 'Bank Account');
    setInstitutionName(acc.institution_name || '');
    setLastFour(acc.last_four || '');
    setOpeningBalance(acc.opening_balance || 0);
    setColor(acc.color || '#3B82F6');
    setNotes(acc.notes || '');
    setError('');
    setShowAddModal(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter an account name.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        name,
        type,
        institution_name: institutionName,
        last_four: lastFour,
        opening_balance: parseFloat(openingBalance || 0),
        color,
        notes
      };

      if (editingAcc) {
        await api.updateAccount(editingAcc.id, payload);
      } else {
        await api.addAccount(payload);
      }

      setShowAddModal(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      console.error('Error saving account:', err);
      setError(err.message || 'Failed to save account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (acc) => {
    try {
      await api.deleteAccount(acc.id);
      fetchAccounts();
    } catch (err) {
      if (err.message && err.message.includes('transaction')) {
        setDeleteConfirmAcc(acc);
        setTxCountNotice(err.message);
      } else {
        alert(err.message || 'Unable to delete account.');
      }
    }
  };

  const handleArchiveAccount = async (accId) => {
    try {
      await api.archiveAccount(accId);
      setDeleteConfirmAcc(null);
      setTxCountNotice(null);
      fetchAccounts();
    } catch (err) {
      console.error('Error archiving account:', err);
    }
  };

  const handleForceDeleteAccount = async (accId) => {
    try {
      await api.deleteAccount(accId, 'delete_all');
      setDeleteConfirmAcc(null);
      setTxCountNotice(null);
      fetchAccounts();
    } catch (err) {
      console.error('Error deleting account and transactions:', err);
    }
  };

  const handleRestoreAccount = async (accId) => {
    try {
      await api.restoreAccount(accId);
      fetchAccounts();
    } catch (err) {
      console.error('Error restoring account:', err);
    }
  };

  const getAccountIcon = (accType) => {
    switch (accType) {
      case 'Bank Account':
      case 'Bank': return <FaUniversity className="text-indigo-400 text-xl" />;
      case 'Credit Card':
      case 'Debit Card': return <FaCreditCard className="text-red-400 text-xl" />;
      case 'Cash': return <FaMoneyBillWave className="text-emerald-400 text-xl" />;
      case 'UPI': return <FaExchangeAlt className="text-purple-400 text-xl" />;
      case 'Wallet': return <FaWallet className="text-blue-400 text-xl" />;
      case 'Investment': return <FaChartLine className="text-amber-400 text-xl" />;
      case 'Loan': return <FaLandmark className="text-rose-400 text-xl" />;
      default: return <FaPiggyBank className="text-cyan-400 text-xl" />;
    }
  };

  const activeAccounts = accounts.filter(a => !a.is_archived);
  const archivedAccounts = accounts.filter(a => a.is_archived);
  const totalBalance = activeAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Accounts & Wallets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your bank accounts, credit cards, UPI, and cash balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
              showArchived
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {showArchived ? 'Hide Archived' : `Archived (${archivedAccounts.length})`}
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <FaPlus /> Add New Account
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Total Net Liquidity</div>
        <div className="text-3xl sm:text-4xl font-black text-white mt-1 mb-2">{formatAmount(totalBalance)}</div>
        <div className="text-xs text-slate-400">
          Active Accounts: <span className="text-white font-bold">{activeAccounts.length}</span>
        </div>
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl">
            <FaWallet />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No accounts yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Add your first bank account, cash wallet, or UPI account to begin tracking your finances seamlessly.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition inline-flex items-center gap-2"
          >
            <FaPlus /> Add Your First Account
          </button>
        </div>
      )}

      {/* Active Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeAccounts.map(acc => (
          <div
            key={acc.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between relative group"
            style={{ borderLeft: `4px solid ${acc.color || '#3B82F6'}` }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{acc.name}</h3>
                    <span className="text-xs text-slate-400">
                      {acc.type} {acc.institution_name ? `• ${acc.institution_name}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs"
                    title="Edit Account"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleArchiveAccount(acc.id)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg text-xs"
                    title="Archive Account"
                  >
                    <FaArchive />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(acc)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-xs"
                    title="Delete Account"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>

              {acc.last_four && (
                <div className="text-xs text-slate-500 mb-2 font-mono">•••• {acc.last_four}</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-end justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Current Balance</span>
                <span className={`text-xl font-black ${acc.current_balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatAmount(acc.current_balance)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Archived Accounts Section */}
      {showArchived && archivedAccounts.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <FaArchive className="text-amber-400" /> Archived Accounts ({archivedAccounts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedAccounts.map(acc => (
              <div key={acc.id} className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4 opacity-75">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {getAccountIcon(acc.type)}
                    <div>
                      <h4 className="text-sm font-bold text-slate-300">{acc.name}</h4>
                      <span className="text-xs text-slate-500">Archived</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreAccount(acc.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-indigo-400 rounded-lg flex items-center gap-1 font-semibold"
                  >
                    <FaUndo /> Restore
                  </button>
                </div>
                <div className="text-base font-bold text-slate-400">{formatAmount(acc.current_balance)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <FaTimes />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">
              {editingAcc ? 'Edit Account' : 'Add New Account'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, Salary Account"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Account Type *
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Cash">Cash Wallet</option>
                    <option value="UPI">UPI Account</option>
                    <option value="Wallet">Digital Wallet</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Investment">Investment</option>
                    <option value="Loan">Loan Account</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Opening Balance (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Institution / Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC, ICICI, SBI"
                    value={institutionName}
                    onChange={e => setInstitutionName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Last 4 Digits (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="e.g. 4321"
                    value={lastFour}
                    onChange={e => setLastFour(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Card Theme Color
                </label>
                <div className="flex items-center gap-3">
                  {['#3B82F6', '#10B981', '#6366F1', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition transform ${color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  {loading ? 'Saving...' : editingAcc ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Modal */}
      {deleteConfirmAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <FaExclamationTriangle className="text-2xl" />
              <h3 className="text-lg font-bold text-white">Account Deletion Safety</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {txCountNotice || `This account contains existing transactions.`}
            </p>

            <p className="text-xs text-slate-400">
              We recommend archiving the account to preserve your historical financial reports and statements.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleArchiveAccount(deleteConfirmAcc.id)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition"
              >
                Archive Account (Recommended)
              </button>

              <button
                onClick={() => handleForceDeleteAccount(deleteConfirmAcc.id)}
                className="w-full py-2.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 font-bold text-sm rounded-xl transition"
              >
                Delete Account & Transactions
              </button>

              <button
                onClick={() => setDeleteConfirmAcc(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
