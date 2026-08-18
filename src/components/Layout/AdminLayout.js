import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../Admin/AdminSidebar';
import AdminTopbar from '../Admin/AdminTopbar';
import { FaBars, FaTimes } from 'react-icons/fa';

const AdminLayout = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen]);

  return (
    <div className="admin-app-layout" style={{ display: 'flex', minHeight: '100vh', background: '#0b0f19', color: '#f8fafc' }}>
      
      {/* Mobile Menu Toggle Bar (visible < 992px) */}
      <div className="admin-mobile-header" style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: '#0f172a',
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        zIndex: 900,
        padding: '0 16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            {isMobileDrawerOpen ? <FaTimes /> : <FaBars />}
            <span>Admin Menu</span>
          </button>
        </div>
        <span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
          FINAI CONTROL PANEL
        </span>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100
          }}
        />
      )}

      {/* Desktop & Mobile Drawer Sidebar Wrapper */}
      <div className={`admin-sidebar-wrapper ${isMobileDrawerOpen ? 'mobile-open' : ''}`} style={{
        zIndex: 1200
      }}>
        <AdminSidebar isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
      </div>

      {/* Main Admin Content Container */}
      <div className="admin-content-wrapper" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflowX: 'hidden'
      }}>
        <AdminTopbar />
        <main style={{ flex: 1, padding: '24px', background: '#0b0f19' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .admin-mobile-header {
            display: flex !important;
          }
          .admin-content-wrapper {
            margin-top: 60px;
          }
          .admin-sidebar-wrapper {
            position: fixed;
            top: 0;
            left: -280px;
            width: 260px;
            height: 100vh;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .admin-sidebar-wrapper.mobile-open {
            left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
