import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as storageService from '../utils/storageService';

export const CategoriesContext = createContext(null);

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState(storageService.getCategories());

  const refreshCategories = useCallback(() => {
    setCategories(storageService.getCategories());
  }, []);

  useEffect(() => {
    refreshCategories(); 
  }, [refreshCategories]);

  const addExpenseCategory = (newCategory) => {
    if (storageService.addExpenseCategory(newCategory)) {
      refreshCategories();
      return true;
    }
    return false;
  };

  const addIncomeCategory = (newCategory) => {
    if (storageService.addIncomeCategory(newCategory)) {
      refreshCategories();
      return true;
    }
    return false;
  };

  const deleteExpenseCategory = (categoryToDelete) => {
    if (storageService.deleteExpenseCategory(categoryToDelete)) {
      refreshCategories();
      return true;
    }
    return false;
  };

  const deleteIncomeCategory = (categoryToDelete) => {
    if (storageService.deleteIncomeCategory(categoryToDelete)) {
      refreshCategories();
      return true;
    }
    return false;
  };

  return (
    <CategoriesContext.Provider value={{ categories, addExpenseCategory, addIncomeCategory, deleteExpenseCategory, deleteIncomeCategory, refreshCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
};