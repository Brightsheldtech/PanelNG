import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('panelng_token');
    const saved = localStorage.getItem('panelng_user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data;
    localStorage.setItem('panelng_token', token);
    localStorage.setItem('panelng_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (email, full_name, password) => {
    const res = await api.post('/auth/register', { email, full_name, password });
    const { user, token } = res.data;
    localStorage.setItem('panelng_token', token);
    localStorage.setItem('panelng_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('panelng_token');
    localStorage.removeItem('panelng_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('panelng_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
