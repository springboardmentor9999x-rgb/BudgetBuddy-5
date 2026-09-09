import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('budgetbuddy_user') || localStorage.getItem('budgetbuddy_user');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    const saved = sessionStorage.getItem('budgetbuddy_token') || localStorage.getItem('budgetbuddy_token');
    return (saved && saved !== 'undefined') ? saved : null;
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [token]);

  const saveAuthData = (tokenData, userData) => {
    sessionStorage.setItem('budgetbuddy_token', tokenData);
    sessionStorage.setItem('budgetbuddy_user', JSON.stringify(userData));
    localStorage.setItem('budgetbuddy_token', tokenData);
    localStorage.setItem('budgetbuddy_user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      sessionStorage.setItem('budgetbuddy_user', JSON.stringify(res.data));
      localStorage.setItem('budgetbuddy_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to fetch user', err);
      if (token && token.startsWith('demo_access_token')) {
        setLoading(false);
        return;
      }
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const login = async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const res = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, user: userData } = res.data;
    saveAuthData(access_token, userData);
    fetchNotifications();
    return userData;
  };

  const register = async (email, fullName, password, role = 'student') => {
    const res = await api.post('/auth/register', {
      email,
      full_name: fullName,
      password,
      role
    });
    return res.data;
  };

  const verifyEmail = async (email, code) => {
    const res = await api.post('/auth/verify-email', { email, code });
    const { access_token, user: userData } = res.data;
    saveAuthData(access_token, userData);
    fetchNotifications();
    return userData;
  };

  const resendVerification = async (email) => {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  };

  const oauthLogin = async (provider, email, fullName, providerId) => {
    const res = await api.post('/auth/oauth/login', {
      provider,
      email,
      full_name: fullName,
      provider_id: providerId
    });

    const { access_token, user: userData } = res.data;
    saveAuthData(access_token, userData);
    fetchNotifications();
    return userData;
  };

  const logout = () => {
    sessionStorage.removeItem('budgetbuddy_token');
    sessionStorage.removeItem('budgetbuddy_user');
    localStorage.removeItem('budgetbuddy_token');
    localStorage.removeItem('budgetbuddy_user');
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const demoLogin = (role = 'student') => {
    const demoUserMap = {
      student: { id: 2, email: 'student@budgetbuddy.com', full_name: 'bharadwaj (Student)', role: 'student', is_email_verified: true, is_active: true },
      premium: { id: 3, email: 'premium@budgetbuddy.com', full_name: 'yashwanth (Premium)', role: 'premium', is_email_verified: true, is_active: true },
      admin: { id: 1, email: 'admin@budgetbuddy.com', full_name: 'System Administrator', role: 'admin', is_email_verified: true, is_active: true }
    };
    const demoUser = demoUserMap[role] || demoUserMap.student;
    const demoToken = `demo_access_token_${role}_${Date.now()}`;
    saveAuthData(demoToken, demoUser);
    setNotifications([
      { id: 101, title: "Welcome to BudgetBuddy!", message: "You are currently previewing BudgetBuddy interactive platform.", type: "system", is_read: false }
    ]);
    return demoUser;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      verifyEmail,
      resendVerification,
      oauthLogin,
      demoLogin,
      logout,
      notifications,
      fetchNotifications,
      markNotificationRead,
      clearAllNotifications,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
