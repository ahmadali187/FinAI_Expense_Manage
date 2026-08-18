import React, { useState, useEffect, useContext, useCallback } from 'react';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import { 
  FaFilter, FaFileCsv, FaPrint, FaArrowUp, FaArrowDown, FaReceipt
} from 'react-icons/fa';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types (Income & Expenses)' },
  { value: 'expense', label: 'Expenses Only' },
  { value: 'income', label: 'Income Only' }
];

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
  const [selectedCategory] = useState('all');
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
        return;
    }

    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.transactions || reportData.transactions.length === 0) {
      alert('No transaction records available to export.');
      return;
    }

    const headers = ['Date', 'Category', 'Description', 'Type', 'Amount', 'Account'];
    const rows = reportData.transactions.map(t => [
      t.date || '',
      `"${t.category || ''}"`,
      `"${t.description || ''}"`,
      t.type || '',
      t.amount || 0,
      `"${t.account_name || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
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

  const summary = reportData?.summary || {
    total_income: 0,
    total_expenses: 0,
    net_cash_flow: 0,
    savings_rate: 0,
    transaction_count: 0,
    avg_daily_spend: 0
  };

  const categoriesBreakdown = reportData?.category_breakdown || [];
  const transactionsList = reportData?.transactions || [];

  const accountOptions = [
    { value: 'all', label: 'All Accounts' },
    ...accounts.map(a => ({ value: a.id, label: a.name }))
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary, #f8fafc)' }}>
            Financial Reports
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)', fontSize: '0.95rem' }}>
            Understand where your money goes with cash flow metrics and detailed transaction breakdowns.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" icon={FaFileCsv} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="outline" icon={FaPrint} onClick={handlePrint}>
            Print Report
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', color: '#f87171', marginBottom: '20px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <Card style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <Select
            label="Date Range Preset"
            value={selectedPreset}
            onChange={(e) => handlePresetSelect(e.target.value)}
            options={DATE_PRESETS}
          />

          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setSelectedPreset('custom');
            }}
          />

          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setSelectedPreset('custom');
            }}
          />

          <Select
            label="Filter Account"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            options={accountOptions}
          />

          <Select
            label="Transaction Type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={TYPE_OPTIONS}
          />

          <div style={{ marginBottom: '12px' }}>
            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={generateReport}
              icon={FaFilter}
            >
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <Card style={{ borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
            TOTAL INCOME
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {formatAmount(summary.total_income)}
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
            TOTAL EXPENSES
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {formatAmount(summary.total_expenses)}
          </div>
        </Card>

        <Card style={{ borderLeft: `4px solid ${summary.net_cash_flow >= 0 ? '#10b981' : '#ef4444'}` }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: summary.net_cash_flow >= 0 ? '#34d399' : '#f87171', textTransform: 'uppercase' }}>
            NET CASH FLOW
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {formatAmount(summary.net_cash_flow)}
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid #4f46e5' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
            SAVINGS RATE
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {summary.savings_rate || 0}%
          </div>
        </Card>

        <Card style={{ borderLeft: '4px solid #38bdf8' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
            TRANSACTIONS
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {summary.transaction_count || 0}
          </div>
        </Card>
      </div>

      {/* Category Breakdown & Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <Card title="Category Spending Breakdown">
          {categoriesBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
              No category expense breakdown available for this range.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {categoriesBreakdown.map((cat, idx) => {
                const percentage = summary.total_expenses > 0 ? Math.round((cat.amount / summary.total_expenses) * 100) : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{cat.category}</span>
                      <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{formatAmount(cat.amount)} ({percentage}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(percentage, 100)}%`, background: 'linear-gradient(90deg, #4f46e5, #9333ea)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Transactions List / Cards */}
      <Card title={`Detailed Transactions (${transactionsList.length})`}>
        {transactionsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <FaReceipt size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div>No transactions recorded within the selected filters and date range.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactionsList.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: tx.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: tx.type === 'income' ? '#34d399' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {tx.type === 'income' ? <FaArrowUp size={16} /> : <FaArrowDown size={16} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {tx.category || 'General'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                      {tx.description || 'No description'} • {tx.account_name || 'Account'} • {tx.date}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: tx.type === 'income' ? '#34d399' : '#f87171'
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                  </div>
                  <Badge variant={tx.type === 'income' ? 'income' : 'expense'}>
                    {tx.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
};

export default ReportPage;