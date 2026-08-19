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
    window.addEventListener('transactionMutated', fetchTransactions);
    return () => {
      window.removeEventListener('storage', fetchTransactions);
      window.removeEventListener('authChange', fetchTransactions);
      window.removeEventListener('transactionMutated', fetchTransactions);
    };
  }, [fetchTransactions]);

  useEffect(() => {
    if (!socket) return;

    const handleFinancialEvent = (evt) => {
      if (evt && evt.type && (evt.type.startsWith('transaction.') || evt.type.startsWith('dashboard.') || evt.type.startsWith('account.'))) {
        fetchTransactions();
        window.dispatchEvent(new CustomEvent('transactionMutated'));
        window.dispatchEvent(new CustomEvent('accountMutated'));
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
      fetchTransactions();
      window.dispatchEvent(new CustomEvent('transactionMutated'));
      window.dispatchEvent(new CustomEvent('accountMutated'));
      return newTx;
    } catch (err) {
      console.error("Error adding transaction:", err);
      return null;
    }
  };

  const handleUpdateTransaction = async (txId, txData) => {
    try {
      const updatedTx = await api.updateTransaction(txId, txData);
      fetchTransactions();
      window.dispatchEvent(new CustomEvent('transactionMutated'));
      window.dispatchEvent(new CustomEvent('accountMutated'));
      return updatedTx;
    } catch (err) {
      console.error("Error updating transaction:", err);
      return null;
    }
  };

  const handleDeleteTransaction = async (txId) => {
    try {
      await api.deleteTransaction(txId);
      fetchTransactions();
      window.dispatchEvent(new CustomEvent('transactionMutated'));
      window.dispatchEvent(new CustomEvent('accountMutated'));
      return true;
    } catch (err) {
      console.error("Error deleting transaction:", err);
      return false;
    }
  };

  return (
    <TransactionsContext.Provider value={{ transactions, loading, addTransaction: handleAddTransaction, updateTransaction: handleUpdateTransaction, deleteTransaction: handleDeleteTransaction, refreshTransactions: fetchTransactions }}>
      {children}
    </TransactionsContext.Provider>
  );
};