// src/utils/storageService.js

const USERS_KEY = 'users';
const LOGGED_IN_USER_KEY = 'loggedInUser';
const LAST_USER_EMAIL_KEY = 'lastUserEmail';
const TRANSACTIONS_KEY = 'transactions';
const BUDGETS_KEY = 'budgets';
const CATEGORIES_KEY = 'categories';

const DEFAULT_EXPENSE_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];
const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Bonus', 'Gift', 'Investment', 'Other'];

// Helper to normalize emails for case-insensitive matching
const norm = (email) => (email ? String(email).trim().toLowerCase() : '');

// --- User Management ---
export const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getLoggedInUser = () => {
  const user = localStorage.getItem(LOGGED_IN_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setLoggedInUser = (user) => {
  if (user && user.email) {
    user.email = norm(user.email);
  }
  localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
};

export const removeLoggedInUser = () => {
  localStorage.removeItem(LOGGED_IN_USER_KEY);
};

export const getLastUserEmail = () => {
  return localStorage.getItem(LAST_USER_EMAIL_KEY);
};

export const setLastUserEmail = (email) => {
  localStorage.setItem(LAST_USER_EMAIL_KEY, norm(email));
};

export const findUserByGoogleSub = (googleSub) => {
  if (!googleSub) return null;
  const users = getUsers();
  return users.find(u => u.googleSub === googleSub || u.google_id === googleSub) || null;
};

export const linkOrRegisterGoogleUser = (googleProfile) => {
  const users = getUsers();
  const sub = googleProfile.sub;
  const email = norm(googleProfile.email);

  // 1. Check if user already exists by Google sub
  let user = users.find(u => u.googleSub === sub || u.google_id === sub);
  if (user) {
    user.picture = googleProfile.picture || user.picture;
    user.name = user.name || googleProfile.name;
    saveUsers(users);
    return user;
  }

  // 2. Check if user exists by verified email (Safely link account)
  if (email && googleProfile.emailVerified) {
    user = users.find(u => norm(u.email) === email);
    if (user) {
      user.googleSub = sub;
      user.google_id = sub;
      user.picture = googleProfile.picture || user.picture;
      user.authProvider = user.authProvider || 'google';
      saveUsers(users);
      return user;
    }
  }

  // 3. Register new Google user
  const newUser = {
    id: `google_${sub}`,
    googleSub: sub,
    google_id: sub,
    email: email,
    name: googleProfile.name || email.split('@')[0],
    picture: googleProfile.picture || '',
    authProvider: 'google',
    emailVerified: googleProfile.emailVerified || false,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
};

// --- Transaction Management ---
export const getAllTransactions = () => {
  const transactions = localStorage.getItem(TRANSACTIONS_KEY);
  return transactions ? JSON.parse(transactions) : [];
};

export const saveAllTransactions = (transactions) => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const getUserTransactions = (userEmail) => {
  if (!userEmail) return [];
  const targetEmail = norm(userEmail);
  const allTransactions = getAllTransactions();
  return allTransactions.filter(t => norm(t.userEmail) === targetEmail);
};

export const addTransaction = (newTransaction) => {
  const allTransactions = getAllTransactions();
  if (newTransaction.userEmail) {
    newTransaction.userEmail = norm(newTransaction.userEmail);
  }
  allTransactions.push(newTransaction);
  saveAllTransactions(allTransactions);
};

export const updateTransaction = (updatedTransaction) => {
  let allTransactions = getAllTransactions();
  const targetEmail = norm(updatedTransaction.userEmail);
  const index = allTransactions.findIndex(t => t.id === updatedTransaction.id && norm(t.userEmail) === targetEmail);
  if (index !== -1) {
    updatedTransaction.userEmail = targetEmail;
    allTransactions[index] = updatedTransaction;
    saveAllTransactions(allTransactions);
    return true;
  }
  return false;
};

export const deleteTransaction = (transactionId, userEmail) => {
  let allTransactions = getAllTransactions();
  const targetEmail = norm(userEmail);
  const initialLength = allTransactions.length;
  allTransactions = allTransactions.filter(t => !(t.id === transactionId && norm(t.userEmail) === targetEmail));
  if (allTransactions.length < initialLength) {
    saveAllTransactions(allTransactions);
    return true;
  }
  return false;
};

// --- Category Management ---
export const getCategories = () => {
  const categories = localStorage.getItem(CATEGORIES_KEY);
  if (categories) {
    return JSON.parse(categories);
  }
  const defaultCategories = {
    expense: [...DEFAULT_EXPENSE_CATEGORIES],
    income: [...DEFAULT_INCOME_CATEGORIES],
  };
  saveCategories(defaultCategories);
  return defaultCategories;
};

export const saveCategories = (categories) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const addExpenseCategory = (newCategory) => {
  const currentCategories = getCategories();
  if (!currentCategories.expense.includes(newCategory)) {
    currentCategories.expense.push(newCategory);
    saveCategories(currentCategories);
    return true;
  }
  return false;
};

export const addIncomeCategory = (newCategory) => {
  const currentCategories = getCategories();
  if (!currentCategories.income.includes(newCategory)) {
    currentCategories.income.push(newCategory);
    saveCategories(currentCategories);
    return true;
  }
  return false;
};

export const deleteExpenseCategory = (categoryToDelete) => {
  const currentCategories = getCategories();
  const initialLength = currentCategories.expense.length;
  currentCategories.expense = currentCategories.expense.filter(cat => cat !== categoryToDelete);
  if (currentCategories.expense.length < initialLength) {
    saveCategories(currentCategories);
    return true;
  }
  return false;
};

export const deleteIncomeCategory = (categoryToDelete) => {
  const currentCategories = getCategories();
  const initialLength = currentCategories.income.length;
  currentCategories.income = currentCategories.income.filter(cat => cat !== categoryToDelete);
  if (currentCategories.income.length < initialLength) {
    saveCategories(currentCategories);
    return true;
  }
  return false;
};

// --- Budget Management ---
export const getAllBudgets = () => {
  const budgets = localStorage.getItem(BUDGETS_KEY);
  return budgets ? JSON.parse(budgets) : [];
};

export const saveAllBudgets = (budgets) => {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
};

export const getUserBudgets = (userEmail) => {
  if (!userEmail) return [];
  const targetEmail = norm(userEmail);
  const allBudgets = getAllBudgets();
  return allBudgets.filter(b => norm(b.userEmail) === targetEmail);
};

export const addBudget = (newBudget) => {
  let allBudgets = getAllBudgets();
  const targetEmail = norm(newBudget.userEmail);
  newBudget.userEmail = targetEmail;

  const existingIdx = allBudgets.findIndex(
    b => norm(b.userEmail) === targetEmail && b.category === newBudget.category
  );

  if (existingIdx !== -1) {
    allBudgets[existingIdx] = { ...allBudgets[existingIdx], ...newBudget };
  } else {
    allBudgets.push(newBudget);
  }
  saveAllBudgets(allBudgets);
};

export const deleteBudget = (budgetId, userEmail) => {
  let allBudgets = getAllBudgets();
  const targetEmail = norm(userEmail);
  const initialLength = allBudgets.length;
  allBudgets = allBudgets.filter(b => !(b.id === budgetId && norm(b.userEmail) === targetEmail));
  if (allBudgets.length < initialLength) {
    saveAllBudgets(allBudgets);
    return true;
  }
  return false;
};