import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const AdminShell = ({ activeTab, onSearchOpen, onRefresh, children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Enterprise Navigation Sidebar */}
      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Administrative Workplace Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Enterprise Topbar Header */}
        <AdminTopbar
          activeTab={activeTab}
          onSearchOpen={onSearchOpen}
          onRefresh={onRefresh}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Content View Container */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
