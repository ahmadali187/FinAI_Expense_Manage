import React from 'react';
import { FaFileImage, FaChartBar, FaUsers, FaExchangeAlt, FaPiggyBank } from 'react-icons/fa';
import * as api from '../../services/api';

const AdminReports = () => {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaChartBar color="#818cf8" size={24} />
          <div>
            <h3 style={{ margin: 0, color: '#ffffff' }}>FinAI Executive Reporting & Export Center</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Download Python Matplotlib analytical PNG chart reports and export database CSV files.
            </p>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Report 1: Financial Cashflow */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <FaExchangeAlt color="#34d399" size={20} />
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem' }}>Financial Cashflow Report</h4>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '16px' }}>
              Analytical report covering system-wide income, expenses, and net cashflow trends.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={api.getAdminReportDownloadUrl('financial')}
              target="_blank"
              rel="noreferrer"
              className="btn-gradient-primary"
              style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
            >
              <FaFileImage /> Download PNG Chart
            </a>
          </div>
        </div>

        {/* Report 2: User Base Growth */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(129, 140, 248, 0.4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <FaUsers color="#818cf8" size={20} />
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem' }}>User Base Growth Report</h4>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '16px' }}>
              Cumulative user registrations line chart and active vs inactive account metrics.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={api.getAdminReportDownloadUrl('users')}
              target="_blank"
              rel="noreferrer"
              className="btn-gradient-primary"
              style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
            >
              <FaFileImage /> Download PNG Chart
            </a>
          </div>
        </div>

        {/* Report 3: Category Spending Breakdown */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(244, 114, 182, 0.4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <FaPiggyBank color="#f472b6" size={20} />
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem' }}>Category Expense Breakdown</h4>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '16px' }}>
              Horizontal bar chart visualizing total spending grouped by expense category.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={api.getAdminReportDownloadUrl('transactions')}
              target="_blank"
              rel="noreferrer"
              className="btn-gradient-primary"
              style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 12px' }}
            >
              <FaFileImage /> Download PNG Chart
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminReports;
