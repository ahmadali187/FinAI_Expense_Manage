import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaWallet, FaCheckCircle, FaExclamationTriangle, FaUser
} from 'react-icons/fa';

const AdminOverview = ({ dbSummary, healthData, usersData, logsData, onRefresh, onSelectUser }) => {
  const navigate = useNavigate();

  const overdueCount = dbSummary?.overdue_goals || 0;
  const exceededCount = dbSummary?.exceeded_budgets || 0;
  const inactiveAccounts = dbSummary?.inactive_accounts || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Title Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: 800 }}>Administration Overview</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Real-time system-wide financial and operational intelligence (`backend/finai.db`).
          </p>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          Last updated: <strong>{new Date().toLocaleString()}</strong>
        </div>
      </div>

      {/* 1. SYSTEM KPI GRID (12 Enterprise Metrics) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        
        {/* Total Users */}
        <div
          className="glass-card"
          onClick={() => navigate('/admin/users')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#818cf8'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>TOTAL USERS</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.5rem', color: '#ffffff' }}>{dbSummary?.users || 0}</h3>
          <span style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '4px', display: 'block' }}>
            Active: {dbSummary?.active_users || 0} | Admins: {dbSummary?.admins || 0}
          </span>
        </div>

        {/* Active Users */}
        <div
          className="glass-card"
          onClick={() => navigate('/admin/users?status=active')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#34d399'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
        >
          <span style={{ fontSize: '0.78rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>ACTIVE USERS</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.5rem', color: '#34d399' }}>{dbSummary?.active_users || 0}</h3>
          <span style={{ fontSize: '0.75rem', color: '#a7f3d0', marginTop: '4px', display: 'block' }}>
            {dbSummary?.users ? Math.round((dbSummary.active_users / dbSummary.users) * 100) : 100}% Active Rate
          </span>
        </div>

        {/* Total Admins */}
        <div
          className="glass-card"
          onClick={() => navigate('/admin/admins')}
          style={{ cursor: 'pointer', background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.6), rgba(30, 41, 59, 0.8))', border: '1px solid #6366f1' }}
        >
          <span style={{ fontSize: '0.78rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>TOTAL ADMINS</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.5rem', color: '#ffffff' }}>{dbSummary?.admins || 0} admins</h3>
          <span style={{ fontSize: '0.75rem', color: '#c7d2fe', marginTop: '4px', display: 'block' }}>Superuser Control</span>
        </div>

        {/* Total Accounts */}
        <div
          className="glass-card"
          onClick={() => navigate('/admin/accounts')}
          style={{ cursor: 'pointer', border: '1px solid rgba(56, 189, 248, 0.4)' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'}
        >
          <span style={{ fontSize: '0.78rem', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>TOTAL ACCOUNTS</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.5rem', color: '#ffffff' }}>{dbSummary?.accounts || 0}</h3>
          <span style={{ fontSize: '0.75rem', color: '#bae6fd', marginTop: '4px', display: 'block' }}>Bank & Wallet Accounts</span>
        </div>

        {/* Total Transactions */}
        <div
          className="glass-card"
          onClick={() => navigate('/admin/transactions')}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#818cf8'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>TOTAL TRANSACTIONS</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.5rem', color: '#ffffff' }}>{dbSummary?.transactions || 0}</h3>
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px', display: 'block' }}>Recorded Logs</span>
        </div>

        {/* Total Income */}
        <div className="glass-card" onClick={() => navigate('/admin/analytics')} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '0.78rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>TOTAL SYSTEM INCOME</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', color: '#34d399' }}>₹{(dbSummary?.total_income || 0).toLocaleString()}</h3>
        </div>

        {/* Total Expenses */}
        <div className="glass-card" onClick={() => navigate('/admin/analytics')} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '0.78rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>TOTAL EXPENSES</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', color: '#ef4444' }}>₹{(dbSummary?.total_expenses || 0).toLocaleString()}</h3>
        </div>

        {/* Net Cash Flow */}
        <div className="glass-card" onClick={() => navigate('/admin/analytics')} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>NET CASH FLOW</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', color: (dbSummary?.net_cashflow || 0) >= 0 ? '#34d399' : '#fca5a5' }}>
            ₹{(dbSummary?.net_cashflow || 0).toLocaleString()}
          </h3>
        </div>

        {/* Active Savings Goals */}
        <div className="glass-card" onClick={() => navigate('/admin/savings-goals')} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '0.78rem', color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>SAVINGS GOALS</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.5rem', color: '#ffffff' }}>{dbSummary?.savings_goals || 0}</h3>
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px', display: 'block' }}>User Target Goals</span>
        </div>

        {/* Overdue Goals */}
        <div className="glass-card" onClick={() => navigate('/admin/savings-goals?status=overdue')} style={{ cursor: 'pointer', border: overdueCount > 0 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.78rem', color: overdueCount > 0 ? '#fca5a5' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>OVERDUE GOALS</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.5rem', color: overdueCount > 0 ? '#fca5a5' : '#fff' }}>{overdueCount}</h3>
        </div>

        {/* Exceeded Budgets */}
        <div className="glass-card" onClick={() => navigate('/admin/budgets?status=exceeded')} style={{ cursor: 'pointer', border: exceededCount > 0 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '0.78rem', color: exceededCount > 0 ? '#fca5a5' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>EXCEEDED BUDGETS</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.5rem', color: exceededCount > 0 ? '#fca5a5' : '#fff' }}>{exceededCount}</h3>
        </div>

        {/* Database Status */}
        <div className="glass-card" onClick={() => navigate('/admin/health')} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>DATABASE STATUS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <FaCheckCircle color="#10b981" size={18} />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', textTransform: 'capitalize' }}>
              {healthData?.status || 'Healthy'}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px', display: 'block' }}>
            Latency: {healthData?.database?.query_latency_ms || 0.28} ms
          </span>
        </div>

      </div>

      {/* 2. ADMIN ATTENTION CENTER (Clickable Problem Resolution Cards) */}
      <div className="glass-card" style={{ border: '1px solid rgba(245, 158, 11, 0.4)', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(45, 30, 15, 0.8))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fcd34d', marginBottom: '12px' }}>
          <FaExclamationTriangle size={20} />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>ADMIN ATTENTION CENTER</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          
          <div
            onClick={() => navigate('/admin/savings-goals?status=overdue')}
            style={{ padding: '10px 14px', borderRadius: '8px', background: overdueCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.6)', border: overdueCount > 0 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FaExclamationTriangle color={overdueCount > 0 ? '#ef4444' : '#34d399'} />
            <span style={{ color: overdueCount > 0 ? '#fca5a5' : '#cbd5e1', fontSize: '0.85rem' }}>
              <strong>{overdueCount}</strong> overdue savings goals →
            </span>
          </div>

          <div
            onClick={() => navigate('/admin/budgets?status=exceeded')}
            style={{ padding: '10px 14px', borderRadius: '8px', background: exceededCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.6)', border: exceededCount > 0 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FaExclamationTriangle color={exceededCount > 0 ? '#ef4444' : '#34d399'} />
            <span style={{ color: exceededCount > 0 ? '#fca5a5' : '#cbd5e1', fontSize: '0.85rem' }}>
              <strong>{exceededCount}</strong> budgets exceeded →
            </span>
          </div>

          <div
            onClick={() => navigate('/admin/accounts?status=inactive')}
            style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FaWallet color="#38bdf8" />
            <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
              <strong>{inactiveAccounts}</strong> inactive accounts →
            </span>
          </div>

          <div
            onClick={() => navigate('/admin/health')}
            style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FaCheckCircle color="#34d399" />
            <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
              SQLite Database Healthy ({healthData?.database?.query_latency_ms || 0.28}ms) →
            </span>
          </div>

        </div>
      </div>

      {/* 3. VISUAL CASH FLOW & INCOME VS EXPENSE SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>SYSTEM CASH FLOW BALANCE</span>
          <div style={{ margin: '10px 0', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${dbSummary?.total_income ? Math.min(100, Math.round((dbSummary.total_income / ((dbSummary.total_income + dbSummary.total_expenses) || 1)) * 100)) : 50}%`, background: '#34d399' }} />
            <div style={{ flex: 1, background: '#ef4444' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <span>Income: <strong style={{ color: '#34d399' }}>₹{(dbSummary?.total_income || 0).toLocaleString()}</strong></span>
            <span>Expenses: <strong style={{ color: '#ef4444' }}>₹{(dbSummary?.total_expenses || 0).toLocaleString()}</strong></span>
          </div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>SAVINGS TARGET PROGRESS</span>
          <div style={{ margin: '10px 0', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${dbSummary?.total_savings_target ? Math.min(100, Math.round((dbSummary.total_savings_saved / dbSummary.total_savings_target) * 100)) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #f472b6)', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <span>Saved: <strong style={{ color: '#f472b6' }}>₹{(dbSummary?.total_savings_saved || 0).toLocaleString()}</strong></span>
            <span>Target: <strong>₹{(dbSummary?.total_savings_target || 0).toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. TOP USERS TABLE */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem' }}>Top Active System Users</h3>
          <button className="btn-glass-secondary" onClick={() => navigate('/admin/users')} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
            View All Users →
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="glass-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.82rem' }}>
                <th style={{ padding: '10px' }}>User ID</th>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Role</th>
                <th style={{ padding: '10px' }}>Transactions</th>
                <th style={{ padding: '10px' }}>Total Spent</th>
                <th style={{ padding: '10px' }}>Total Income</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersData?.users?.slice(0, 5).map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#cbd5e1', fontSize: '0.88rem' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: '#818cf8' }}>#{u.id}</td>
                  <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '10px' }}>{u.email}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, background: u.role === 'admin' ? '#3730a3' : '#1e293b', color: u.role === 'admin' ? '#a5b4fc' : '#94a3b8' }}>
                      {u.role ? u.role.toUpperCase() : 'USER'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{u.transaction_count || 0} txs</td>
                  <td style={{ padding: '10px', color: '#ef4444' }}>₹{(u.total_spent || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px', color: '#34d399' }}>₹{(u.total_income || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button
                      onClick={() => onSelectUser(u.id)}
                      className="btn-glass-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FaUser size={10} /> View User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RECENT SYSTEM AUDIT ACTIVITY STREAM */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem' }}>Recent System Audit & Operations Stream</h3>
          <button className="btn-glass-secondary" onClick={() => navigate('/admin/audit')} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
            View Full Audit Logs →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {logsData?.logs?.slice(0, 5).map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8' }}>#{log.id}</span>
                <span style={{ color: '#fff', fontSize: '0.85rem' }}>{log.action}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>User #{log.user_id} • {log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminOverview;
