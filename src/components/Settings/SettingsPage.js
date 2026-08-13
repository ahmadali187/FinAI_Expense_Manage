import React, { lazy, Suspense } from 'react';
import { FaCog } from 'react-icons/fa';
const CategoryManager = lazy(() => import('./CategoryManager'));

const SettingsPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FaCog color="var(--primary-glow)" size={24} />
        <h2 style={{ margin: 0, fontWeight: 800 }}>Application Settings</h2>
      </div>

      <Suspense fallback={<div className="glass-card">Loading Category Manager...</div>}>
        <CategoryManager />
      </Suspense>
    </div>
  );
};

export default SettingsPage;