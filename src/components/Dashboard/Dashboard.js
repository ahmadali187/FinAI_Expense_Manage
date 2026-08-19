import React, { useState, useEffect, lazy, Suspense, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { TransactionsContext } from '../../contexts/TransactionsContext';
import { BudgetsContext } from '../../contexts/BudgetsContext';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';

import Alert from '../common/Alert';
import MoneyBriefing from './MoneyBriefing';
import SafeToSpendCard from './SafeToSpendCard';
import WhatChangedWidget from './WhatChangedWidget';
import FinancialHealthScore from './FinancialHealthScore';
import SavingsGoalsTracker from '../Finance/SavingsGoalsTracker';
import SubscriptionTracker from '../Finance/SubscriptionTracker';
import NetWorthTracker from '../Finance/NetWorthTracker';
import BillSplitterModal from '../Finance/BillSplitterModal';
import ReceiptScannerModal from '../AI/ReceiptScannerModal';
import QuickAddExpenseModal from '../AI/QuickAddExpenseModal';
import CsvImportModal from '../Finance/CsvImportModal';
import NotificationCenter from '../Notifications/NotificationCenter';
import AffordabilityCard from '../AI/AffordabilityCard';
import AddTransactionModal from './AddTransactionModal';

import { analyzeSpendingAnomalies } from '../../utils/aiEngine';
import { exportTransactionsToCSV, generatePDFStatement } from '../../utils/exportService';

import {
  FaPlus, FaReceipt, FaUsers, FaDownload, FaPrint, FaFileCsv,
  FaArrowUp, FaArrowDown, FaWallet, FaExclamationTriangle, FaTrash, FaEdit, FaMagic
} from 'react-icons/fa';

const BudgetManager = lazy(() => import('../Budget/BudgetManager'));
const ExpenseChart = lazy(() => import('../Charts/ExpenseChart'));
const EditTransactionModal = lazy(() => import('./EditTransactionModal'));

const Dashboard = () => {
  const { loggedInUser } = useContext(UserContext);
  const { transactions, deleteTransaction: deleteTransFromContext, refreshTransactions } = useContext(TransactionsContext);
  const { budgets } = useContext(BudgetsContext);
  const { formatAmount } = useContext(CurrencyContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Modals for Advanced Features
  const [showBillSplitter, setShowBillSplitter] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [aiAnomalies, setAiAnomalies] = useState([]);


  const fetchBackendDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.warn("Failed to fetch dashboard data from Python backend:", err);
    }
  }, []);

  useEffect(() => {
    if (!loggedInUser) {
      navigate('/login');
    } else {
      fetchBackendDashboard();
    }
    window.addEventListener('transactionMutated', fetchBackendDashboard);
    window.addEventListener('accountMutated', fetchBackendDashboard);
    return () => {
      window.removeEventListener('transactionMutated', fetchBackendDashboard);
      window.removeEventListener('accountMutated', fetchBackendDashboard);
    };
  }, [loggedInUser, navigate, fetchBackendDashboard, transactions]);

  const checkAlerts = useCallback(() => {
    if (!loggedInUser) return;

    const newAlerts = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    budgets.forEach(budget => {
      const spent = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return (
            t.type === 'expense' &&
            t.category === budget.category &&
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      if (spent > budget.amount) {
        newAlerts.push(
          `Budget Exceeded for ${budget.category}! Spent ${formatAmount(spent)} of ${formatAmount(budget.amount)} limit.`
        );
      }
    });
    setBudgetAlerts(newAlerts);
  }, [loggedInUser, budgets, transactions, formatAmount]);

  useEffect(() => {
    checkAlerts();
    const anomalies = analyzeSpendingAnomalies(transactions, budgets);
    setAiAnomalies(anomalies);
  }, [checkAlerts, transactions, budgets]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpenses;

  const handleReceiptScanned = () => {
    setShowReceiptScanner(false);
    setShowAddModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Good Morning Money Briefing */}
      <MoneyBriefing dashboardData={dashboardData} />

      {/* Quick Action Tools Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
        <NotificationCenter />

        <button className="btn-gradient-primary" onClick={() => setShowQuickAdd(true)} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}>
          <FaMagic /> FinAI Quick Add
        </button>

        <button className="btn-gradient-primary" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Add Expense
        </button>
        <button className="btn-glass-secondary" onClick={() => setShowReceiptScanner(true)}>
          <FaReceipt /> Scan Receipt
        </button>
        <button className="btn-glass-secondary" onClick={() => setShowCsvImport(true)}>
          <FaFileCsv color="#10b981" /> Import CSV
        </button>
        <button className="btn-glass-secondary" onClick={() => setShowBillSplitter(true)}>
          <FaUsers /> Split Bill
        </button>
        <button className="btn-glass-secondary" onClick={() => exportTransactionsToCSV(transactions)}>
          <FaDownload /> Export CSV
        </button>
        <button className="btn-glass-secondary" onClick={() => generatePDFStatement(transactions, budgets, loggedInUser)}>
          <FaPrint /> Print Statement
        </button>
      </div>

      {/* 2. Safe to Spend Card */}
      {dashboardData?.safe_to_spend && (
        <SafeToSpendCard safeToSpendData={dashboardData.safe_to_spend} />
      )}

      {/* FinAI Purchase Affordability Calculator */}
      <AffordabilityCard />

      {/* 3. What Changed Intelligence Widget */}
      <WhatChangedWidget transactions={transactions} />

      {/* Budget Overlimit Alerts */}
      {budgetAlerts.map((alert, index) => (
        <Alert key={index} type="warning" message={alert} />
      ))}

      {/* AI Spending Anomalies Alert */}
      {aiAnomalies.length > 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b' }}>
          <FaExclamationTriangle size={20} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem' }}>
              {typeof aiAnomalies[0] === 'object' ? aiAnomalies[0].title : 'FinAI Anomaly Alert'}
            </strong>
            <span style={{ fontSize: '0.85rem' }}>
              {typeof aiAnomalies[0] === 'object' ? aiAnomalies[0].message : aiAnomalies[0]}
            </span>
          </div>
        </div>
      )}

      {/* Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Income</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <FaArrowUp />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatAmount(totalIncome)}</div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Expenses</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <FaArrowDown />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatAmount(totalExpenses)}</div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Net Cashflow Balance</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <FaWallet />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>
            {formatAmount(netBalance)}
          </div>
        </div>
      </div>

      {/* Feature Pillar 1: Financial Health Score */}
      <FinancialHealthScore />

      {/* Visual Charts & Budget Manager */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <Suspense fallback={<div className="glass-card">Loading Chart Analytics...</div>}>
          <ExpenseChart />
        </Suspense>

        <Suspense fallback={<div className="glass-card">Loading Budget Limits...</div>}>
          <BudgetManager userEmail={loggedInUser?.email} />
        </Suspense>
      </div>

      {/* Net Worth & Liabilities Tracker */}
      <NetWorthTracker />

      {/* Savings Goals Component */}
      <SavingsGoalsTracker />

      {/* Feature Pillar 2: Recurring Subscriptions & Bills */}
      <SubscriptionTracker />

      {/* Recent Transactions List */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Transaction History ({transactions.length})</h3>
          <button className="btn-gradient-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAddModal(true)}>
            + New Record
          </button>
        </div>

        {transactions && transactions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px' }}>Category</th>
                  <th style={{ padding: '10px 12px' }}>Description</th>
                  <th style={{ padding: '10px 12px' }}>Amount</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 15).map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: '#cbd5e1' }}>{t.date}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: t.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: t.type === 'income' ? '#10b981' : '#ef4444'
                      }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>{t.category}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)' }}>{t.description || '-'}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color: t.type === 'income' ? '#10b981' : 'var(--text-primary, #f8fafc)' }}>
                      {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        className="btn-glass-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', marginRight: '6px' }}
                        onClick={() => { setEditingTransaction(t); setShowEditModal(true); }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-glass-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                        onClick={async () => {
                          await deleteTransFromContext(t.id);
                          fetchBackendDashboard();
                        }}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 16px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 600 }}>No financial transactions logged yet.</p>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginTop: '4px', marginBottom: '16px' }}>Start tracking your money by adding an expense or income record.</span>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-gradient-primary" style={{ fontSize: '0.85rem' }} onClick={() => setShowAddModal(true)}>
                + Add Transaction
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        initialType="expense"
        onTransactionAdded={() => {
          refreshTransactions();
          fetchBackendDashboard();
        }}
      />


      {/* Quick Add Modal */}
      <QuickAddExpenseModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAdded={() => {
          refreshTransactions();
          fetchBackendDashboard();
        }}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onImported={() => {
          refreshTransactions();
          fetchBackendDashboard();
        }}
      />

      {/* Edit Modal Suspense */}
      {showEditModal && editingTransaction && (
        <Suspense fallback={null}>
          <EditTransactionModal
            transaction={editingTransaction}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
          />
        </Suspense>
      )}

      {/* Advanced Feature Modals */}
      <BillSplitterModal isOpen={showBillSplitter} onClose={() => setShowBillSplitter(false)} />
      <ReceiptScannerModal isOpen={showReceiptScanner} onClose={() => setShowReceiptScanner(false)} onScanned={handleReceiptScanned} />
    </div>
  );
};

export default Dashboard;