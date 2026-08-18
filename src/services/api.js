// Centralized API Client for Python Flask Backend & SQLite Database
const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL || 
                 process.env.VITE_API_URL || 
                 process.env.REACT_APP_API_BASE_URL || 
                 process.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const getAuthHeader = () => {
  const token = localStorage.getItem('finai_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader()
  };

  const config = {
    method,
    headers
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'API Request failed');
    }

    return result;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};

// --- Auth Endpoints ---
export const loginUser = (email, password) => apiRequest('/auth/login', 'POST', { email, password });
export const registerUser = (name, email, password) => apiRequest('/auth/register', 'POST', { name, email, password });
export const googleAuthUser = (googleProfile) => apiRequest('/auth/google', 'POST', googleProfile);
export const guestAuthUser = () => apiRequest('/auth/guest', 'POST');
export const getCurrentUser = () => apiRequest('/auth/me');
export const changePassword = (current_password, new_password) => apiRequest('/auth/change-password', 'POST', { current_password, new_password });
export const deleteUserAccount = () => apiRequest('/user/account', 'DELETE');

// --- Accounts / Wallets ---
export const getAccounts = (includeArchived = false) => apiRequest(`/accounts${includeArchived ? '?include_archived=true' : ''}`);
export const addAccount = (accData) => apiRequest('/accounts', 'POST', accData);
export const updateAccount = (accId, accData) => apiRequest(`/accounts/${accId}`, 'PUT', accData);
export const deleteAccount = (accId, action = null) => apiRequest(`/accounts/${accId}${action ? `?action=${action}` : ''}`, 'DELETE');
export const archiveAccount = (accId) => apiRequest(`/accounts/${accId}/archive`, 'PUT');
export const restoreAccount = (accId) => apiRequest(`/accounts/${accId}/restore`, 'PUT');

// --- Dashboard & Intelligence ---
export const getDashboardData = () => apiRequest('/dashboard');
export const getNetWorthData = () => apiRequest('/net-worth');
export const getSubscriptionsDetect = () => apiRequest('/subscriptions/detect');
export const getActivityLogs = () => apiRequest('/activity-logs');

// --- CRUD Financial Endpoints ---
export const getTransactions = () => apiRequest('/transactions');
export const addTransaction = (txData) => apiRequest('/transactions', 'POST', txData);
export const updateTransaction = (txId, txData) => apiRequest(`/transactions/${txId}`, 'PUT', txData);
export const deleteTransaction = (txId) => apiRequest(`/transactions/${txId}`, 'DELETE');

export const getBudgets = () => apiRequest('/budgets');
export const addBudget = (budgetData) => apiRequest('/budgets', 'POST', budgetData);
export const deleteBudget = (budgetId) => apiRequest(`/budgets/${budgetId}`, 'DELETE');

export const getSubscriptions = () => apiRequest('/subscriptions');
export const addSubscription = (subData) => apiRequest('/subscriptions', 'POST', subData);
export const toggleSubscription = (subId) => apiRequest(`/subscriptions/${subId}/toggle`, 'PUT');
export const deleteSubscription = (subId) => apiRequest(`/subscriptions/${subId}`, 'DELETE');

export const getSavingsGoals = () => apiRequest('/goals');
export const addSavingsGoal = (goalData) => apiRequest('/goals', 'POST', goalData);
export const depositSavingsGoal = (goalId, amount) => apiRequest(`/goals/${goalId}`, 'PUT', { add_deposit: amount });
export const deleteSavingsGoal = (goalId) => apiRequest(`/goals/${goalId}`, 'DELETE');

export const generateFinancialReport = (params) => apiRequest('/reports/generate', 'POST', params);
export const getReportTemplates = () => apiRequest('/report-templates');
export const addReportTemplate = (tmplData) => apiRequest('/report-templates', 'POST', tmplData);
export const deleteReportTemplate = (tmplId) => apiRequest(`/report-templates/${tmplId}`, 'DELETE');

export const getNotifications = () => apiRequest('/notifications');
export const markNotificationsRead = () => apiRequest('/notifications/mark-read', 'PUT');

export const addAsset = (assetData) => apiRequest('/assets', 'POST', assetData);
export const addLiability = (liabilityData) => apiRequest('/liabilities', 'POST', liabilityData);

// --- AI Copilot & Imports ---
export const getAiQuickQuestions = () => apiRequest('/ai/quick-questions');
export const sendAiChat = (query) => apiRequest('/ai/chat', 'POST', { query });
export const confirmAiAction = (proposal) => apiRequest('/ai/confirm-action', 'POST', { proposal });
export const parseQuickAdd = (text) => apiRequest('/ai/quick-add', 'POST', { text });
export const importCsv = (records) => apiRequest('/import/csv', 'POST', { records });
export const triggerDemoData = () => apiRequest('/demo-data', 'POST');

// --- Admin Superuser APIs ---
export const postAdminAiChat = (query) => apiRequest('/admin/ai/chat', 'POST', { query });
export const getAdminDatabaseSummary = () => apiRequest('/admin/database-summary');
export const getAdminDatabaseHealth = () => apiRequest('/admin/system-health');
export const getAdminUsers = (params = {}) => {
  const queryStr = new URLSearchParams(params).toString();
  return apiRequest(`/admin/users${queryStr ? '?' + queryStr : ''}`);
};
export const getAdminUserDetail = (userId) => apiRequest(`/admin/users/${userId}`);
export const toggleAdminUserStatus = (userId, is_active, role) => apiRequest(`/admin/users/${userId}/status`, 'PUT', { is_active, role });
export const getAdminAnalytics = (period = '30days') => apiRequest(`/admin/analytics?period=${period}`);
export const getAdminTables = () => apiRequest('/admin/tables');
export const getAdminTableDetail = (tableName) => apiRequest(`/admin/tables/${tableName}`);
export const getAdminActivityLogs = (params = {}) => {
  const queryStr = new URLSearchParams(params).toString();
  return apiRequest(`/admin/activity-logs${queryStr ? '?' + queryStr : ''}`);
};
export const getAdminAccounts = (params = {}) => {
  const queryStr = new URLSearchParams(params).toString();
  return apiRequest(`/admin/accounts${queryStr ? '?' + queryStr : ''}`);
};
export const getAdminTransactions = (params = {}) => {
  const queryStr = new URLSearchParams(params).toString();
  return apiRequest(`/admin/transactions${queryStr ? '?' + queryStr : ''}`);
};
export const getAdminSavingsGoals = (params = {}) => {
  const queryStr = new URLSearchParams(params).toString();
  return apiRequest(`/admin/savings-goals${queryStr ? '?' + queryStr : ''}`);
};
export const getAdminBudgets = (params = {}) => {
  const queryStr = new URLSearchParams(params).toString();
  return apiRequest(`/admin/budgets${queryStr ? '?' + queryStr : ''}`);
};
export const getAdminGlobalSearch = (q) => apiRequest(`/admin/search?q=${encodeURIComponent(q)}`);
export const getAdminReportDownloadUrl = (reportType) => `${API_BASE_URL}/admin/reports/${reportType}`;
export const postAdminChangePassword = (current_password, new_password) => apiRequest('/admin/change-password', 'POST', { current_password, new_password });
export const triggerAdminDbBackup = () => apiRequest('/admin/backup-db', 'POST');
