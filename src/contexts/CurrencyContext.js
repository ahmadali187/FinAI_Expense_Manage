import React, { createContext, useState } from 'react';

export const CurrencyContext = createContext();

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.5 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 155.2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.36 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.51 },
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('userCurrency');
    return saved && CURRENCIES[saved] ? CURRENCIES[saved] : CURRENCIES.INR;
  });

  const changeCurrency = (currencyCode) => {
    if (CURRENCIES[currencyCode]) {
      setCurrency(CURRENCIES[currencyCode]);
      localStorage.setItem('userCurrency', currencyCode);
    }
  };

  const formatAmount = (amountInINR) => {
    const num = parseFloat(amountInINR) || 0;
    if (currency.code === 'INR') {
      return `${currency.symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    const converted = (num / CURRENCIES.INR.rate) * currency.rate;
    return `${currency.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getConvertedNumber = (amountInINR) => {
    const num = parseFloat(amountInINR) || 0;
    if (currency.code === 'INR') return num;
    return (num / CURRENCIES.INR.rate) * currency.rate;
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, formatAmount, getConvertedNumber, CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
};
