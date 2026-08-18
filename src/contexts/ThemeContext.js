import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'dark';
  });

  useEffect(() => {
    const applyTheme = (mode) => {
      let activeMode = mode;
      if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeMode = prefersDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', activeMode);
      document.body.setAttribute('data-theme', activeMode);
    };

    applyTheme(theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
