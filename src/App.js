import React, { useState, useEffect } from 'react';
import { UserProvider } from './contexts/UserContext';
import { TransactionsProvider } from './contexts/TransactionsContext';
import { BudgetsProvider } from './contexts/BudgetsContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/App.css';

import ProtectedUserRoute from './components/Layout/ProtectedUserRoute';
import ProtectedAdminRoute from './components/Layout/ProtectedAdminRoute';
import UserLayout from './components/Layout/UserLayout';
import AdminLayout from './components/Layout/AdminLayout';
import SplashScreen from './components/Layout/SplashScreen';
import NotFound from './components/common/NotFound';

// Page Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import AccountsPage from './components/Finance/AccountsPage';
import SettingsPage from './components/Settings/SettingsPage';
import ProfilePage from './components/Profile/ProfilePage';
import ReportPage from './components/Report/ReportPage';
import FinAiPage from './components/AI/FinAiPage';
import AdminDashboard from './components/Admin/AdminDashboard';

import { SocketProvider } from './contexts/SocketContext';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1026999155282-1am1jufbqvr48md1thi4k683din17m88.apps.googleusercontent.com';

const Home = () => (
  <div style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '0 20px' }} className="glass-card">
    <div style={{
      width: '60px',
      height: '60px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px auto',
      color: '#fff',
      fontSize: '1.8rem',
      fontWeight: 800
    }}>
      Fin
    </div>
    <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
      FinAI — AI Personal Finance Copilot
    </h1>
    <p style={{ color: 'var(--text-secondary, #cbd5e1)', fontSize: '1.05rem', margin: '0 0 28px 0', lineHeight: 1.6 }}>
      Understand your money. Track expenses, manage budgets, monitor goals, and get personalized AI-powered financial guidance.
    </p>
    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link to="/login" className="btn-gradient-primary">Sign In to Account</Link>
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
                  <ThemeProvider>
                    <Router>
                      <AppContent />
                    </Router>
                  </ThemeProvider>
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -10 }
  };

  const pageTransition = { duration: 0.25, ease: "easeOut" };

  return (
    <AnimatePresence>
      {showSplash ? (
        <SplashScreen key="splash" />
      ) : (
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Unauthenticated Routes */}
            <Route path="/" element={<motion.div key="home" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Home /></motion.div>} />
            <Route path="/login" element={<motion.div key="login" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Login /></motion.div>} />
            <Route path="/register" element={<motion.div key="register" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Register /></motion.div>} />

            {/* Protected Normal User Routes */}
            <Route element={<ProtectedUserRoute />}>
              <Route element={<UserLayout />}>
                <Route path="/dashboard" element={<motion.div key="dashboard" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Dashboard /></motion.div>} />
                <Route path="/accounts" element={<motion.div key="accounts" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><AccountsPage /></motion.div>} />
                <Route path="/settings" element={<motion.div key="settings" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><SettingsPage /></motion.div>} />
                <Route path="/profile" element={<motion.div key="profile" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ProfilePage /></motion.div>} />
                <Route path="/report" element={<motion.div key="report" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><ReportPage /></motion.div>} />
                <Route path="/finai" element={<motion.div key="finai" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><FinAiPage /></motion.div>} />
              </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedAdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<motion.div key="admin-root" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><AdminDashboard /></motion.div>} />
                <Route path="/admin/*" element={<motion.div key="admin-sub" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><AdminDashboard /></motion.div>} />
              </Route>
            </Route>

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      )}
    </AnimatePresence>
  );
};

export default App;
