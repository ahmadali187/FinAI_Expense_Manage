import React, { useState, lazy, Suspense } from 'react';
import { FaTags, FaSlidersH, FaBell } from 'react-icons/fa';
import Card from '../ui/Card';
import Button from '../ui/Button';

const CategoryManager = lazy(() => import('./CategoryManager'));

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
          Application Settings
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Default Currency</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Set primary display currency across all reports and metrics</div>
              </div>
              <span style={{ fontWeight: 800, color: '#818cf8', fontSize: '1rem' }}>INR (₹)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Theme Mode</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Dark theme optimized for high contrast financial visualization</div>
              </div>
              <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.88rem' }}>Dark Theme (Active)</span>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card title="Notification Preferences">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Budget Exceeded Alerts</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Receive immediate warnings when spending exceeds set monthly budget limits</div>
              </div>
              <span style={{ fontWeight: 700, color: '#34d399' }}>Enabled</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Unusual Spending Anomaly Detection</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>FinAI automated alerts on sudden spending spikes</div>
              </div>
              <span style={{ fontWeight: 700, color: '#34d399' }}>Enabled</span>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
};

export default SettingsPage;