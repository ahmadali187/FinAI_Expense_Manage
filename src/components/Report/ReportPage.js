import React, { useState, useEffect, useContext, useCallback } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import { 
  FaFileInvoiceDollar, FaFilter, 
  FaFileCsv, FaPrint, FaArrowUp, FaArrowDown
} from 'react-icons/fa';

const ReportPage = () => {
  const { formatAmount } = useContext(CurrencyContext);

  const getMonthStart = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getToday());
  const [selectedPreset, setSelectedPreset] = useState('this_month');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const [accounts, setAccounts] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAccountsList = async () => {
    try {
      const data = await api.getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const generateReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.generateFinancialReport({
        from_date: fromDate,
        to_date: toDate,
        account_id: selectedAccount,
        category: selectedCategory,
        type: selectedType
      });
      setReportData(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate financial report.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedAccount, selectedCategory, selectedType]);

  useEffect(() => {
    fetchAccountsList();
    generateReport();
  }, [generateReport]);

  const handlePresetSelect = (presetKey) => {
    setSelectedPreset(presetKey);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (presetKey) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'this_week':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(today.setDate(diff));
        end = new Date();
        break;
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date();
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last_3_months':
        start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        end = new Date();
        break;
      case 'this_year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date();
        break;
      default:
        break;
    }

    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.transactions || reportData.transactions.length === 0) {
      alert('No transaction data available to export.');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount (INR)'];
    const rows = reportData.transactions.map(t => [
      t.date ? t.date.split('T')[0] : '',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.category || '',
      t.type || '',
      t.amount || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinAI_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const categoriesList = [
    'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 
    'Health', 'Housing', 'Education', 'Salary', 'Freelance', 'Investments', 'Other'
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FaFileInvoiceDollar className="text-indigo-400" /> Financial Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate, analyze, and export date-driven financial statements and expense breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 transition"
          >
            <FaFileCsv className="text-sm" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
          >
            <FaPrint className="text-sm" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Report Filter Controls Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Date Range Quick Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { key: 'today', label: 'Today' },
            { key: 'this_week', label: 'This Week' },
            { key: 'this_month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'last_3_months', label: 'Last 3 Months' },
            { key: 'this_year', label: 'This Year' }
          ].map(preset => (
            <button
              key={preset.key}
              onClick={() => handlePresetSelect(preset.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedPreset === preset.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setSelectedPreset('custom');
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setSelectedPreset('custom');
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Account Filter</label>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <FaFilter /> {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Generated Report Summary Metrics */}
      {reportData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 font-medium block">Total Income</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 block">
                {formatAmount(reportData.summary?.total_income || 0)}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 font-medium block">Total Expenses</span>
              <span className="text-lg sm:text-xl font-bold text-red-400 mt-1 block">
                {formatAmount(reportData.summary?.total_expense || 0)}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 font-medium block">Net Cash Flow</span>
              <span className={`text-lg sm:text-xl font-bold mt-1 block ${(reportData.summary?.net_cash_flow || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatAmount(reportData.summary?.net_cash_flow || 0)}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 font-medium block">Savings Rate</span>
              <span className="text-lg sm:text-xl font-bold text-cyan-400 mt-1 block">
                {reportData.summary?.savings_rate || 0}%
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 font-medium block">Transactions</span>
              <span className="text-lg sm:text-xl font-bold text-white mt-1 block">
                {reportData.summary?.transaction_count || 0}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 font-medium block">Avg Daily Spend</span>
              <span className="text-lg sm:text-xl font-bold text-indigo-300 mt-1 block">
                {formatAmount(reportData.summary?.avg_daily_spending || 0)}
              </span>
            </div>
          </div>

          {/* Breakdowns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Expenses Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaArrowDown className="text-red-400" /> Expenses by Category
              </h3>
              {Object.keys(reportData.breakdowns?.expense_by_category || {}).length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No category expense records in date range.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(reportData.breakdowns.expense_by_category).map(([cat, amt]) => {
                    const pct = reportData.summary.total_expense > 0 ? (amt / reportData.summary.total_expense * 100).toFixed(1) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{cat}</span>
                          <span className="text-white">{formatAmount(amt)} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Income by Category Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaArrowUp className="text-emerald-400" /> Income by Category
              </h3>
              {Object.keys(reportData.breakdowns?.income_by_category || {}).length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No income records in date range.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(reportData.breakdowns.income_by_category).map(([cat, amt]) => {
                    const pct = reportData.summary.total_income > 0 ? (amt / reportData.summary.total_income * 100).toFixed(1) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{cat}</span>
                          <span className="text-white">{formatAmount(amt)} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">Statement Transactions ({reportData.transactions?.length || 0})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reportData.transactions?.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-3 text-slate-400 font-mono">{t.date ? t.date.split('T')[0] : '-'}</td>
                      <td className="py-3 text-white font-medium">{t.description || t.category}</td>
                      <td className="py-3 text-slate-400">{t.category}</td>
                      <td className={`py-3 text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;