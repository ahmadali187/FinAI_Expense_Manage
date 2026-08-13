// src/utils/demoDataLoader.js
import * as storageService from './storageService';

/**
 * Loads a rich realistic sample dataset of transactions and budgets for the current user
 * @param {string} userEmail - User's email address
 */
export const loadSampleFinancialData = (userEmail) => {
  if (!userEmail) return false;

  const sampleTransactions = [
    { id: 'sample_t1', userEmail, type: 'income', amount: 85000, category: 'Salary', date: '2026-08-01', description: 'Monthly Tech Salary Credit' },
    { id: 'sample_t2', userEmail, type: 'expense', amount: 15500, category: 'Utilities', date: '2026-08-02', description: 'Apartment Rent & Electricity' },
    { id: 'sample_t3', userEmail, type: 'expense', amount: 4200, category: 'Food', date: '2026-08-03', description: 'Grocery Supermarket Restock' },
    { id: 'sample_t4', userEmail, type: 'expense', amount: 1200, category: 'Entertainment', date: '2026-08-04', description: 'Movie IMAX Tickets & Snacks' },
    { id: 'sample_t5', userEmail, type: 'income', amount: 12500, category: 'Investment', date: '2026-08-05', description: 'Stock Dividend Yield' },
    { id: 'sample_t6', userEmail, type: 'expense', amount: 2800, category: 'Transport', date: '2026-08-06', description: 'Weekly Fuel Refill' },
    { id: 'sample_t7', userEmail, type: 'expense', amount: 3500, category: 'Shopping', date: '2026-08-07', description: 'Wireless Earbuds Purchase' },
    { id: 'sample_t8', userEmail, type: 'expense', amount: 1800, category: 'Health', date: '2026-08-08', description: 'Monthly Gym Membership' },
    { id: 'sample_t9', userEmail, type: 'expense', amount: 999, category: 'Entertainment', date: '2026-08-09', description: 'Netflix & Spotify Premium' },
    { id: 'sample_t10', userEmail, type: 'income', amount: 5000, category: 'Bonus', date: '2026-08-10', description: 'Project Performance Incentive' }
  ];

  const sampleBudgets = [
    { id: 'sample_b1', userEmail, category: 'Food', amount: 10000, period: 'monthly' },
    { id: 'sample_b2', userEmail, category: 'Transport', amount: 5000, period: 'monthly' },
    { id: 'sample_b3', userEmail, category: 'Entertainment', amount: 4000, period: 'monthly' },
    { id: 'sample_b4', userEmail, category: 'Shopping', amount: 8000, period: 'monthly' }
  ];

  // Save to storageService
  const allTx = storageService.getAllTransactions();
  const filteredTx = allTx.filter(t => t.userEmail !== userEmail);
  storageService.saveAllTransactions([...filteredTx, ...sampleTransactions]);

  const allBudgets = storageService.getAllBudgets();
  const filteredB = allBudgets.filter(b => b.userEmail !== userEmail);
  storageService.saveAllBudgets([...filteredB, ...sampleBudgets]);

  window.dispatchEvent(new Event('storage'));
  return true;
};
