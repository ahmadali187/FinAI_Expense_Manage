import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from './UserContext';
import { SocketContext } from './SocketContext';
import * as api from '../services/api';

export const TransactionsContext = createContext(null);

export const TransactionsProvider = ({ children }) => {
  const { loggedInUser } = useContext(UserContext);
  const { socket } = useContext(SocketContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!loggedInUser) {
      setTransactions([]);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch transactions from Python REST API:", err);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchTransactions();
    window.addEventListener('storage', fetchTransactions);
    window.addEventListener('authChange', fetchTransactions);
    return () => {
      window.removeEventListener('storage', fetchTransactions);
      window.removeEventListener('authChange', fetchTransactions);
    };
  }, [fetchTransactions]);

  useEffect(() => {
    if (!socket) return;

    const handleFinancialEvent = (evt) => {
      if (evt && evt.type && (evt.type.startsWith('transaction.') || evt.type.startsWith('dashboard.') || evt.type.startsWith('account.'))) {
        fetchTransactions();
      }
    };

    socket.on('financial_event', handleFinancialEvent);
    return () => {
      socket.off('financial_event', handleFinancialEvent);
    };
  }, [socket, fetchTransactions]);

  const handleAddTransaction = async (txData) => {
    try {
      const newTx = await api.addTransaction(txData);
      setTransactions(prev => [newTx, ...prev]);
      return newTx;
    } catch (err) {
      console.error("Error adding transaction:", err);
      return null;
    }
  };

  const handleDeleteTransaction = async (txId) => {
    try {
      await api.deleteTransaction(txId);
      setTransactions(prev => prev.filter(t => t.id !== txId));
      return true;
    } catch (err) {
      console.error("Error deleting transaction:", err);
      return false;
    }
  };

  return (
    <TransactionsContext.Provider value={{ transactions, loading, addTransaction: handleAddTransaction, deleteTransaction: handleDeleteTransaction, refreshTransactions: fetchTransactions }}>
      {children}
    </TransactionsContext.Provider>
  );
};