import React, { useState } from 'react';
import { FaFileImage, FaChartBar, FaUsers, FaExchangeAlt, FaPiggyBank, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import * as api from '../../services/api';

const AdminReports = () => {
  const [loadingType, setLoadingType] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDownload = async (reportType, defaultFilename) => {
    try {
      setLoadingType(reportType);
      setError('');
      setSuccessMsg('');

      const blob = await api.downloadAdminReport(reportType);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMsg(`✓ ${defaultFilename} downloaded successfully!`);
    } catch (err) {
      console.error(`Download error for ${reportType}:`, err);
      if (err.status === 401) {
        setError('Session expired or authorization token missing. Please log in again.');
      } else if (err.status === 403) {
        setError('Access denied: Administrator privileges required.');
      } else {
        setError(err.message || 'Failed to download report chart. Please try again.');
      }
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaChartBar color="#818cf8" size={24} />
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary, #ffffff)' }}>FinAI Executive Reporting & Export Center</h3>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Download Python Matplotlib analytical PNG chart reports with full authenticated token protection.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '10px',
          color: '#f87171',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          color: '#34d399',
          fontSize: '0.88rem'
        }}>
          {successMsg}
        </div>
      )}

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Report 1: Financial Cashflow */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <FaExchangeAlt color="#34d399" size={20} />
              <h4 style={{ margin: 0, color: 'var(--text-primary, #fff)', fontSize: '1.05rem' }}>Financial Cashflow Report</h4>
            </div>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem', marginBottom: '16px' }}>
              Analytical report covering system-wide income, expenses, and net cashflow trends.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleDownload('financial', 'finai_financial_cashflow_report.png')}
              disabled={loadingType === 'financial'}
              className="btn-gradient-primary"
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', padding: '10px 14px', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#ffffff', fontWeight: 700 }}
            >
              {loadingType === 'financial' ? <FaSpinner className="animate-spin" /> : <FaFileImage />}
              {loadingType === 'financial' ? 'Generating Report...' : 'Download PNG Chart'}
            </button>
          </div>
        </div>

        {/* Report 2: User Base Growth */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(129, 140, 248, 0.4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <FaUsers color="#818cf8" size={20} />
              <h4 style={{ margin: 0, color: 'var(--text-primary, #fff)', fontSize: '1.05rem' }}>User Base Growth Report</h4>
            </div>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem', marginBottom: '16px' }}>
              Cumulative user registrations line chart and active vs inactive account metrics.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleDownload('users', 'finai_user_growth_report.png')}
              disabled={loadingType === 'users'}
              className="btn-gradient-primary"
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', padding: '10px 14px', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#ffffff', fontWeight: 700 }}
            >
              {loadingType === 'users' ? <FaSpinner className="animate-spin" /> : <FaFileImage />}
              {loadingType === 'users' ? 'Generating Report...' : 'Download PNG Chart'}
            </button>
          </div>
        </div>

        {/* Report 3: Category Spending Breakdown */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(244, 114, 182, 0.4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <FaPiggyBank color="#f472b6" size={20} />
              <h4 style={{ margin: 0, color: 'var(--text-primary, #fff)', fontSize: '1.05rem' }}>Category Expense Breakdown</h4>
            </div>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem', marginBottom: '16px' }}>
              Horizontal bar chart visualizing total spending grouped by expense category.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleDownload('transactions', 'finai_category_spending_report.png')}
              disabled={loadingType === 'transactions'}
              className="btn-gradient-primary"
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', padding: '10px 14px', border: 'none', cursor: 'pointer', borderRadius: '10px', color: '#ffffff', fontWeight: 700 }}
            >
              {loadingType === 'transactions' ? <FaSpinner className="animate-spin" /> : <FaFileImage />}
              {loadingType === 'transactions' ? 'Generating Report...' : 'Download PNG Chart'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminReports;
