import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';
import * as api from '../../services/api';

import AdminShell from './AdminShell';
import AdminOverview from './AdminOverview';
import AdminCopilotChat from './AdminCopilotChat';
import UserDetailsModal from './UserDetailsModal';
import AdminAnalytics from './AdminAnalytics';
import TableDetailsModal from './TableDetailsModal';
import AdminAccounts from './AdminAccounts';
import AdminTransactions from './AdminTransactions';
import AdminSavingsGoals from './AdminSavingsGoals';
import AdminBudgets from './AdminBudgets';
import GlobalSearchModal from './GlobalSearchModal';
import AdminProfile from './AdminProfile';
import AdminHealth from './AdminHealth';
import AdminReports from './AdminReports';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [healthData, setHealthData] = useState(null);
  const [dbSummary, setDbSummary] = useState(null);
  const [usersData, setUsersData] = useState({ users: [], total: 0 });
  const [tablesList, setTablesList] = useState([]);
  const [logsData, setLogsData] = useState({ logs: [], total: 0 });
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userSortBy, setUserSortBy] = useState('newest');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Table Details Modal State
  const [selectedTable, setSelectedTable] = useState(null);

  // Audit Logs State
  const [logSearch, setLogSearch] = useState('');

  const validSubRoutes = ['overview', 'users', 'admins', 'accounts', 'transactions', 'savings-goals', 'budgets', 'analytics', 'reports', 'database', 'audit', 'copilot', 'health', 'profile'];

  // Determine active view from URL sub-path (/admin/users, /admin/accounts, etc.)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const subRoute = pathParts.length > 1 ? pathParts[1] : 'overview';
  const activeTab = validSubRoutes.includes(subRoute) ? subRoute : 'overview';

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadAdminData = async () => {
    try {
      setErrorMsg('');
      const [health, summary, usersRes, tables, logsRes] = await Promise.all([
        api.getAdminDatabaseHealth(),
        api.getAdminDatabaseSummary(),
        api.getAdminUsers({ search: userSearch, role: activeTab === 'admins' ? 'admin' : userRoleFilter, status: userStatusFilter, sort_by: userSortBy }),
        api.getAdminTables(),
        api.getAdminActivityLogs({ search: logSearch })
      ]);

      setHealthData(health);
      setDbSummary(summary);
      setUsersData(usersRes && typeof usersRes === 'object' ? usersRes : { users: Array.isArray(usersRes) ? usersRes : [], total: 0 });
      setTablesList(Array.isArray(tables) ? tables : []);
      setLogsData(logsRes && typeof logsRes === 'object' ? logsRes : { logs: Array.isArray(logsRes) ? logsRes : [], total: 0 });
    } catch (err) {
      console.error("Admin data fetch error:", err);
      setErrorMsg(err.message || "Failed to load admin management data. Ensure you have Superuser Admin privileges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    // Safe periodic polling every 15 seconds
    const interval = setInterval(() => {
      loadAdminData();
    }, 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userSearch, userRoleFilter, userStatusFilter, userSortBy, logSearch]);

  const handleSearchResultClick = (tabTarget, entity) => {
    if (tabTarget) {
      navigate(`/admin/${tabTarget === 'overview' ? '' : tabTarget}`);
    }
    if (entity && entity.user_id) {
      setSelectedUserId(entity.user_id);
    } else if (entity && entity.id && tabTarget === 'users') {
      setSelectedUserId(entity.id);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#090d16', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <FaSyncAlt className="fa-spin" size={40} color="#6366f1" />
          <h3 style={{ marginTop: '18px', color: '#fff', fontSize: '1.2rem' }}>Loading FinAI Administration & Control Center...</h3>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#090d16', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '30px', maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fca5a5' }}>
            <FaExclamationTriangle size={28} />
            <h3 style={{ margin: 0 }}>Admin Authorization Failed</h3>
          </div>
          <p style={{ color: '#cbd5e1', marginTop: '12px', fontSize: '0.9rem' }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      activeTab={activeTab}
      onSearchOpen={() => setShowSearchModal(true)}
      onRefresh={loadAdminData}
    >
          
          {/* TAB 1: OVERVIEW */}
          {(activeTab === 'overview' || activeTab === '') && (
            <AdminOverview
              dbSummary={dbSummary}
              healthData={healthData}
              usersData={usersData}
              logsData={logsData}
              onRefresh={loadAdminData}
              onSelectUser={(uid) => setSelectedUserId(uid)}
            />
          )}

          {/* TAB 2: USERS & ADMINS MANAGEMENT */}
          {(activeTab === 'users' || activeTab === 'admins') && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, color: '#ffffff' }}>
                  {activeTab === 'admins' ? 'Registered Administrator Accounts' : `Registered Application Users (${usersData.total})`}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>Click any user to inspect complete financial details & profile.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search by name, email, or user ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                {activeTab !== 'admins' && (
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="">All Roles</option>
                    <option value="user">Normal Users</option>
                    <option value="admin">Admins Only</option>
                  </select>
                )}

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Deactivated Only</option>
                </select>

                <select
                  value={userSortBy}
                  onChange={(e) => setUserSortBy(e.target.value)}
                  style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="most_transactions">Sort: Most Transactions</option>
                  <option value="highest_spending">Sort: Highest Spending</option>
                  <option value="highest_income">Sort: Highest Income</option>
                </select>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="glass-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <th style={{ padding: '10px' }}>ID</th>
                      <th style={{ padding: '10px' }}>Name</th>
                      <th style={{ padding: '10px' }}>Email</th>
                      <th style={{ padding: '10px' }}>Role</th>
                      <th style={{ padding: '10px' }}>Spent</th>
                      <th style={{ padding: '10px' }}>Income</th>
                      <th style={{ padding: '10px' }}>Txs</th>
                      <th style={{ padding: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.users.map(u => (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '0.88rem', cursor: 'pointer' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px', fontWeight: 700, color: '#818cf8' }}>#{u.id}</td>
                        <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '10px' }}>{u.email}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: u.role === 'admin' ? '#3730a3' : '#1e293b', color: u.role === 'admin' ? '#a5b4fc' : '#94a3b8' }}>
                            {u.role ? u.role.toUpperCase() : 'USER'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#ef4444' }}>₹{(u.total_spent || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px', color: '#34d399' }}>₹{(u.total_income || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px' }}>{u.transaction_count || 0}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ color: u.is_active ? '#34d399' : '#fca5a5', fontWeight: 600 }}>
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTS MANAGEMENT */}
          {activeTab === 'accounts' && <AdminAccounts />}

          {/* TAB 4: TRANSACTIONS MANAGEMENT */}
          {activeTab === 'transactions' && <AdminTransactions />}

          {/* TAB 5: SAVINGS GOALS MANAGEMENT */}
          {activeTab === 'savings-goals' && <AdminSavingsGoals />}

          {/* TAB 6: BUDGETS MANAGEMENT */}
          {activeTab === 'budgets' && <AdminBudgets />}

          {/* TAB 7: ANALYTICS */}
          {activeTab === 'analytics' && <AdminAnalytics />}

          {/* TAB 8: REPORTS */}
          {activeTab === 'reports' && <AdminReports />}

          {/* TAB 9: DATABASE SCHEMA */}
          {activeTab === 'database' && (
            <div className="glass-card">
              <h3 style={{ margin: '0 0 16px 0', color: '#ffffff' }}>SQLite Dynamic Database Schema Explorer</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
                SQLite file: <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#818cf8' }}>backend/finai.db</code>. Click any table to inspect columns, data types, and row count.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {tablesList.map(tbl => (
                  <div
                    key={tbl.name}
                    onClick={() => setSelectedTable(tbl.name)}
                    style={{ padding: '16px', background: '#1e293b', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.25)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#818cf8'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{tbl.name}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#312e81', color: '#c7d2fe', fontSize: '0.75rem', fontWeight: 600 }}>
                        {tbl.count} rows
                      </span>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#94a3b8' }}>
                      Columns ({tbl.column_count}): <code>{tbl.columns.slice(0, 3).join(', ')}...</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: '#ffffff' }}>System Audit & Activity Timeline</h3>
                <div style={{ width: '250px' }}>
                  <input
                    type="text"
                    placeholder="Search activity logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    style={{ width: '100%', padding: '6px 12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="glass-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <th style={{ padding: '10px' }}>Log ID</th>
                      <th style={{ padding: '10px' }}>User ID</th>
                      <th style={{ padding: '10px' }}>Action Description</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsData.logs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: '#818cf8' }}>#{log.id}</td>
                        <td style={{ padding: '10px', color: '#94a3b8' }}>User #{log.user_id}</td>
                        <td style={{ padding: '10px', color: '#fff' }}>{log.action}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: COPILOT */}
          {activeTab === 'copilot' && <AdminCopilotChat />}

          {/* TAB 12: SYSTEM HEALTH */}
          {activeTab === 'health' && <AdminHealth />}

          {/* TAB 13: PROFILE */}
          {activeTab === 'profile' && <AdminProfile />}

      {/* MODALS */}
      {selectedUserId && <UserDetailsModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
      {selectedTable && <TableDetailsModal tableName={selectedTable} onClose={() => setSelectedTable(null)} />}
      <GlobalSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} onSelectResult={handleSearchResultClick} />
    </AdminShell>
  );
};

export default AdminDashboard;
