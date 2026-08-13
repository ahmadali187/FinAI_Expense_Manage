import React, { useState, useEffect } from 'react';
import { UserProvider } from './contexts/UserContext';
import { TransactionsProvider } from './contexts/TransactionsContext';
import { BudgetsProvider } from './contexts/BudgetsContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaBars, FaTimes } from 'react-icons/fa';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/App.css';

import Sidebar from './components/Layout/Sidebar';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import SplashScreen from './components/Layout/SplashScreen';
import CommandPalette from './components/common/CommandPalette';
import AiAssistantModal from './components/AI/AiAssistantModal';
import ReceiptScannerModal from './components/AI/ReceiptScannerModal';
import CurrencyConverterModal from './components/Finance/CurrencyConverterModal';
import QuickAddExpenseModal from './components/AI/QuickAddExpenseModal';
import MobileNavbar from './components/Layout/MobileNavbar';

// Page Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import AccountsPage from './components/Finance/AccountsPage';
import SettingsPage from './components/Settings/SettingsPage';
import ProfilePage from './components/Profile/ProfilePage';
import ReportPage from './components/Report/ReportPage';
import AdminDashboard from './components/Admin/AdminDashboard';

import { SocketProvider } from './contexts/SocketContext';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1026999155282-1am1jufbqvr48md1thi4k683din17m88.apps.googleusercontent.com';

const Home = () => (
  <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }} className="glass-card">
    <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>FinAI — AI Personal Finance Copilot</h1>
    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '20px 0' }}>
      Connected financial intelligence, accounts management, safe-to-spend guidance, and natural language expense parsing.
    </p>
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
      <Link to="/login" className="btn-gradient-primary">Login to App</Link>
      <Link to="/register" className="btn-glass-secondary">Create Free Account</Link>
    </div>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <UserProvider>
        <SocketProvider>
          <TransactionsProvider>
            <BudgetsProvider>
              <CategoriesProvider>
                <CurrencyProvider>
                  <Router>
                    <AppContent />
                  </Router>
                </CurrencyProvider>
              </CategoriesProvider>
            </BudgetsProvider>
          </TransactionsProvider>
        </SocketProvider>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Tool Modals
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const noSidebarPaths = ['/login', '/register', '/'];
  const isAdminRoute = location.pathname.startsWith('/admin');
  const showSidebar = !noSidebarPaths.includes(location.pathname) && !isAdminRoute;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -15 }
  };

  const pageTransition = { duration: 0.3, ease: "easeOut" };

  return (
    <AnimatePresence>
      {showSplash ? (
        <SplashScreen key="splash" />
      ) : (
        <div className="app-layout">
          {/* Mobile Sidebar Toggle Button */}
          {showSidebar && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mobile-toggle-btn"
              title="Toggle Menu"
            >
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          )}

          {/* Mobile Overlay Backdrop */}
          {showSidebar && isSidebarOpen && (
            <div
              className="mobile-sidebar-overlay"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {showSidebar && (
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onOpenCmdPalette={() => setShowCmdPalette(true)}
              onOpenAi={() => setShowAiAssistant(true)}
            />
          )}

          <main className={showSidebar ? "content-with-sidebar" : "content-full-width"}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<motion.div key="home" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Home /></motion.div>} />
                <Route path="/login" element={<motion.div key="login" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Login /></motion.div>} />
                <Route path="/register" element={<motion.div key="register" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Register /></motion.div>} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<motion.div key="dashboard" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Dashboard /></motion.div>} />
                  <Route path="/accounts" element={<motion.div key="accounts" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><AccountsPage /></motion.div>} />
                  <Route path="/settings" element={<motion.div key="settings" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><SettingsPage /></motion.div>} />
                  <Route path="/profile" element={<motion.div key="profile" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ProfilePage /></motion.div>} />
                  <Route path="/report" element={<motion.div key="report" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ReportPage /></motion.div>} />
                  <Route path="/admin/*" element={<motion.div key="admin" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><AdminDashboard /></motion.div>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>

          {/* Bottom Mobile Navigation */}
          {showSidebar && (
            <MobileNavbar
              onOpenQuickAdd={() => setShowQuickAdd(true)}
              onOpenAi={() => setShowAiAssistant(true)}
            />
          )}

          {/* Floating AI Assistant Trigger Button */}
          {showSidebar && (
            <button
              className="floating-ai-btn"
              onClick={() => setShowAiAssistant(true)}
              title="Ask FinAI Assistant (Cmd+K)"
            >
              <FaRobot />
            </button>
          )}

          {/* Global Modals */}
          <CommandPalette
            isOpen={showCmdPalette}
            onClose={() => setShowCmdPalette(false)}
            onOpenAi={() => setShowAiAssistant(true)}
            onOpenAddModal={() => setShowQuickAdd(true)}
            onOpenCurrencyModal={() => setShowCurrencyModal(true)}
            onOpenReceiptScanner={() => setShowReceiptScanner(true)}
          />

          <AiAssistantModal
            isOpen={showAiAssistant}
            onClose={() => setShowAiAssistant(false)}
          />

          <QuickAddExpenseModal
            isOpen={showQuickAdd}
            onClose={() => setShowQuickAdd(false)}
          />

          <ReceiptScannerModal
            isOpen={showReceiptScanner}
            onClose={() => setShowReceiptScanner(false)}
          />

          <CurrencyConverterModal
            isOpen={showCurrencyModal}
            onClose={() => setShowCurrencyModal(false)}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default App;
