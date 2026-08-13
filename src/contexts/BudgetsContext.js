import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from './UserContext';
import { SocketContext } from './SocketContext';
import * as api from '../services/api';

export const BudgetsContext = createContext(null);

export const BudgetsProvider = ({ children }) => {
  const { loggedInUser } = useContext(UserContext);
  const { socket } = useContext(SocketContext);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBudgets = useCallback(async () => {
    if (!loggedInUser) {
      setBudgets([]);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getBudgets();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch budgets from Python REST API:", err);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchBudgets();
    window.addEventListener('storage', fetchBudgets);
    window.addEventListener('authChange', fetchBudgets);
    return () => {
      window.removeEventListener('storage', fetchBudgets);
      window.removeEventListener('authChange', fetchBudgets);
    };
  }, [fetchBudgets]);

  useEffect(() => {
    if (!socket) return;

    const handleFinancialEvent = (evt) => {
      if (evt && evt.type && (evt.type.startsWith('budget.') || evt.type.startsWith('dashboard.'))) {
        fetchBudgets();
      }
    };

    socket.on('financial_event', handleFinancialEvent);
    return () => {
      socket.off('financial_event', handleFinancialEvent);
    };
  }, [socket, fetchBudgets]);

  const handleAddBudget = async (bData) => {
    try {
      const newB = await api.addBudget(bData);
      setBudgets(prev => [...prev, newB]);
      return newB;
    } catch (err) {
      console.error("Error adding budget:", err);
      return null;
    }
  };

  const handleDeleteBudget = async (bId) => {
    try {
      await api.deleteBudget(bId);
      setBudgets(prev => prev.filter(b => b.id !== bId));
      return true;
    } catch (err) {
      console.error("Error deleting budget:", err);
      return false;
    }
  };

  return (
    <BudgetsContext.Provider value={{ budgets, loading, addBudget: handleAddBudget, deleteBudget: handleDeleteBudget, refreshBudgets: fetchBudgets }}>
      {children}
    </BudgetsContext.Provider>
  );
};