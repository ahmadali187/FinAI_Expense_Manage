import React, { useState, useContext, lazy, Suspense } from 'react';
import { FaTags, FaSlidersH, FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CurrencyContext, CURRENCIES } from '../../contexts/CurrencyContext';
import { ThemeContext } from '../../contexts/ThemeContext';

const CategoryManager = lazy(() => import('./CategoryManager'));

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const { currency, changeCurrency } = useContext(CurrencyContext);
  const { theme, changeTheme } = useContext(ThemeContext);

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('userNotificationSettings');
    return saved ? JSON.parse(saved) : {
      budgetExceeded: true,
      unusualSpending: true,
      upcomingBills: true,
      savingsGoals: true,
      finAiInsights: true,
      monthlySummary: true
    };
  });

  const toggleNotification = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('userNotificationSettings', JSON.stringify(updated));
      return updated;
    });
  };

  const renderToggleSwitch = (key, label, description) => {
    const isEnabled = notifications[key];
    return (
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ paddingRight: '16px' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary, #f8fafc)', fontSize: '0.95rem' }}>{label}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>{description}</div>
        </div>

        <button
          type="button"
          onClick={() => toggleNotification(key)}
          style={{
            width: '54px',
            height: '28px',
            borderRadius: '14px',
            background: isEnabled ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(148, 163, 184, 0.3)',
            border: 'none',
            padding: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isEnabled ? 'flex-end' : 'flex-start',
            transition: 'all 0.25s ease',
            flexShrink: 0
          }}
          aria-label={`Toggle ${label}`}
        >
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            color: isEnabled ? '#059669' : '#64748b',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {isEnabled ? <FaCheck /> : <FaTimes />}
          </div>
        </button>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary, #f8fafc)' }}>
          Application Settings
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)', fontSize: '0.95rem' }}>
          Configure custom categories, preferences, notifications, and application parameters.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Button
          variant={activeTab === 'categories' ? 'primary' : 'secondary'}
          icon={FaTags}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </Button>

        <Button
          variant={activeTab === 'general' ? 'primary' : 'secondary'}
          icon={FaSlidersH}
          onClick={() => setActiveTab('general')}
        >
          General & Currency
        </Button>

        <Button
          variant={activeTab === 'notifications' ? 'primary' : 'secondary'}
          icon={FaBell}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && (
        <Suspense fallback={<Card><p>Loading Category Manager...</p></Card>}>
          <CategoryManager />
        </Suspense>
      )}

      {activeTab === 'general' && (
        <Card title="General Preferences">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Currency Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #f8fafc)', fontSize: '0.95rem' }}>Default Currency</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>Set primary display currency across all reports, cards, and AI metrics</div>
              </div>

              <select
                value={currency?.code || 'INR'}
                onChange={(e) => changeCurrency(e.target.value)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--surface-glass, rgba(15, 23, 42, 0.85))',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '10px',
                  color: 'var(--text-primary, #818cf8)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {Object.values(CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {curr.code} ({curr.symbol}) — {curr.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #f8fafc)', fontSize: '0.95rem' }}>Theme Mode</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>Switch interface visual styling between Dark, Light, or System preferences</div>
              </div>

              <select
                value={theme}
                onChange={(e) => changeTheme(e.target.value)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--surface-glass, rgba(15, 23, 42, 0.85))',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: '10px',
                  color: 'var(--text-primary, #34d399)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="dark" style={{ background: '#0f172a', color: '#ffffff' }}>🌙 Dark Theme</option>
                <option value="light" style={{ background: '#0f172a', color: '#ffffff' }}>☀️ Light Theme</option>
                <option value="system" style={{ background: '#0f172a', color: '#ffffff' }}>💻 System Preference</option>
              </select>
            </div>

          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card title="Notification Preferences">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {renderToggleSwitch('budgetExceeded', 'Budget Exceeded Alerts', 'Receive immediate warnings when spending exceeds set monthly category budget limits')}
            {renderToggleSwitch('unusualSpending', 'Unusual Spending Anomaly Detection', 'FinAI automated alerts on sudden spending spikes and unusual category surges')}
            {renderToggleSwitch('upcomingBills', 'Upcoming Bill Reminders', 'Notifications for recurring bills 7 days, 3 days, and 1 day prior to due date')}
            {renderToggleSwitch('savingsGoals', 'Savings Goal Progress Updates', 'Milestone notifications when reaching 25%, 50%, 75%, and 100% of target goals')}
            {renderToggleSwitch('finAiInsights', 'FinAI Financial Guidance & Insights', 'Personalized financial health tips and discretionary cashflow advice')}
            {renderToggleSwitch('monthlySummary', 'Monthly FinAI Summary Report', 'Automated end-of-month cashflow analysis and spending comparison overview')}
          </div>
        </Card>
      )}

    </div>
  );
};

export default SettingsPage;