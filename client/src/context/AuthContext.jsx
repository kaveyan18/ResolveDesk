import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { showPushNotification } from '../services/pushNotification';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('resolvedesk_token') || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on initial mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (response.status === 'success') {
          setUser(response.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to restore session:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  // Real-time Push Notification socket listener
  useEffect(() => {
    if (!user || !user._id) return;

    const socket = getSocket();

    const handleNotification = (data) => {
      if (
        data &&
        data.recipientId === user._id.toString() &&
        user.pushNotificationsEnabled !== false
      ) {
        showPushNotification(data.title || 'ResolveDesk Update', {
          body: data.message || 'You have a new complaint update.',
        });
      }
    };

    socket.on('notification_received', handleNotification);

    return () => {
      socket.off('notification_received', handleNotification);
    };
  }, [user]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.login(email, password);
      if (response.status === 'success' && response.token) {
        localStorage.setItem('resolvedesk_token', response.token);
        setToken(response.token);
        setUser(response.user);
        return response.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('resolvedesk_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await api.forgotPassword(email);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    setError(null);
    try {
      const response = await api.resetPassword(email, otp, newPassword);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    error,
    login,
    logout,
    forgotPassword,
    resetPassword,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
