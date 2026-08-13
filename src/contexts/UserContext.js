import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem('loggedInUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [lastUserEmail, setLastUserEmail] = useState(() => localStorage.getItem('lastUserEmail') || '');

  const login = async (email, password) => {
    try {
      const res = await api.loginUser(email, password);
      if (res.token && res.user) {
        localStorage.setItem('finai_auth_token', res.token);
        localStorage.setItem('loggedInUser', JSON.stringify(res.user));
        localStorage.setItem('lastUserEmail', res.user.email);
        setLoggedInUser(res.user);
        setLastUserEmail(res.user.email);
        window.dispatchEvent(new Event('authChange'));
        return res.user;
      }
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
    return null;
  };

  const loginWithGoogle = async (googleProfile) => {
    try {
      const res = await api.googleAuthUser(googleProfile);
      if (res.token && res.user) {
        localStorage.setItem('finai_auth_token', res.token);
        localStorage.setItem('loggedInUser', JSON.stringify(res.user));
        localStorage.setItem('lastUserEmail', res.user.email);
        setLoggedInUser(res.user);
        setLastUserEmail(res.user.email);
        window.dispatchEvent(new Event('authChange'));
        return res.user;
      }
    } catch (err) {
      console.error("Google Auth failed:", err);
      throw err;
    }
    return null;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('finai_auth_token');
    localStorage.removeItem('loggedInUser');
    setLoggedInUser(null);
    window.dispatchEvent(new Event('authChange'));
  }, []);

  const register = async (name, email, password) => {
    try {
      const res = await api.registerUser(name, email, password);
      if (res.token && res.user) {
        localStorage.setItem('finai_auth_token', res.token);
        localStorage.setItem('loggedInUser', JSON.stringify(res.user));
        localStorage.setItem('lastUserEmail', res.user.email);
        setLoggedInUser(res.user);
        setLastUserEmail(res.user.email);
        window.dispatchEvent(new Event('authChange'));
        return res.user;
      }
    } catch (err) {
      console.error("Registration failed:", err);
      throw err;
    }
  };

  const autoGuestLogin = useCallback(async () => {
    try {
      const res = await api.guestAuthUser();
      if (res.token && res.user) {
        localStorage.setItem('finai_auth_token', res.token);
        localStorage.setItem('loggedInUser', JSON.stringify(res.user));
        localStorage.setItem('lastUserEmail', res.user.email);
        setLoggedInUser(res.user);
        setLastUserEmail(res.user.email);
        window.dispatchEvent(new Event('authChange'));
      }
    } catch (err) {
      console.error("Auto guest login failed:", err);
    }
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('finai_auth_token');
      if (token) {
        try {
          const res = await api.getCurrentUser();
          if (res.user) {
            setLoggedInUser(res.user);
            localStorage.setItem('loggedInUser', JSON.stringify(res.user));
          } else {
            await autoGuestLogin();
          }
        } catch (err) {
          console.warn("Token expired or invalid, auto authenticating guest session:", err);
          await autoGuestLogin();
        }
      } else {
        await autoGuestLogin();
      }
    };
    checkUserSession();
  }, [autoGuestLogin]);

  return (
    <UserContext.Provider value={{ loggedInUser, lastUserEmail, login, loginWithGoogle, logout, register, setLastUserEmail }}>
      {children}
    </UserContext.Provider>
  );
};