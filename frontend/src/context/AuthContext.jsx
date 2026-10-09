import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campux_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('campux_token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize user profile from backend on app mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('campux_token');
      if (storedToken) {
        try {
          const res = await api.get('/users/getProfile');
          if (res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('campux_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Initial session check failed:', err.message);
          // If token is invalid or expired, clear
          if (err.response?.status === 401) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('campux_token');
            localStorage.removeItem('campux_user');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = async ({ identifier, password }) => {
    // identifier can be username or email
    const payload = {
      password,
      ...(identifier.includes('@') ? { email: identifier.trim() } : { username: identifier.trim() }),
    };

    const response = await api.post('/users/login', payload);
    const data = response.data?.data;

    if (data) {
      const loggedUser = data.user;
      const accessToken = data.accessToken;

      setUser(loggedUser);
      setToken(accessToken);

      if (accessToken) {
        localStorage.setItem('campux_token', accessToken);
      }
      if (loggedUser) {
        localStorage.setItem('campux_user', JSON.stringify(loggedUser));
      }
    }
    return response.data;
  };

  // Register handler
  const register = async ({ username, name, email, password }) => {
    const response = await api.post('/users/register', {
      username: username.trim().toLowerCase(),
      name: name.trim(),
      email: email.trim(),
      password,
    });
    return response.data;
  };

  // Fetch fresh profile
  const fetchProfile = async () => {
    const response = await api.get('/users/getProfile');
    const profile = response.data?.data;
    if (profile) {
      setUser(profile);
      localStorage.setItem('campux_user', JSON.stringify(profile));
    }
    return profile;
  };

  // Update profile handler
  const updateProfile = async (updateData) => {
    const response = await api.patch('/users/update', updateData);
    const updatedUser = response.data?.data;
    if (updatedUser) {
      setUser((prev) => {
        const merged = { ...prev, ...updatedUser };
        localStorage.setItem('campux_user', JSON.stringify(merged));
        return merged;
      });
    }
    return response.data;
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/users/logout');
    } catch (err) {
      console.warn('Logout request warning:', err.message);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('campux_token');
      localStorage.removeItem('campux_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        updateProfile,
        fetchProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
