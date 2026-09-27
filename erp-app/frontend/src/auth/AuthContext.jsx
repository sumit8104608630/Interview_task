import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { apiResponse, apiError } from '../api/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('erp_token');
    const storedUser = localStorage.getItem('erp_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const data = apiResponse(response);
    const { token: t, user: u } = data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('erp_token', t);
    localStorage.setItem('erp_user', JSON.stringify(u));
    return data.data;
  }, []);

  const sendRegistrationOTP = useCallback(async (email) => {
    const response = await api.post('/auth/send-otp', { email });
    return apiResponse(response);
  }, []);

  const register = useCallback(async (registerData) => {
    const response = await api.post('/auth/register', registerData);
    const data = apiResponse(response);
    const { token: t, user: u } = data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('erp_token', t);
    localStorage.setItem('erp_user', JSON.stringify(u));
    return data.data;
  }, []);

  const sendForgotPasswordOTP = useCallback(async (email) => {
    const response = await api.post('/auth/forgot-password/send-otp', { email });
    return apiResponse(response);
  }, []);

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    const response = await api.post('/auth/forgot-password/reset', {
      email,
      otp,
      newPassword,
    });
    return apiResponse(response);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isSales = user?.role === 'SALES';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authenticated: !!token,
        isAdmin,
        isSales,
        login,
        sendRegistrationOTP,
        register,
        sendForgotPasswordOTP,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
