import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const BALANCE_POLL_MS = 15000;

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

  // Poll wallet balance while logged in
  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      if (!localStorage.getItem('panelng_token')) return;
      try {
        const { data } = await api.get('/wallet/balance');
        if (data?.balance == null) return;
        setUser((prev) => {
          if (!prev || prev.wallet_balance === data.balance) return prev;
          const next = { ...prev, wallet_balance: data.balance };
          localStorage.setItem('panelng_user', JSON.stringify(next));
          return next;
        });
      } catch (_) {}
    };

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchBalance();
    }, BALANCE_POLL_MS);

    const onVisible = () => { if (document.visibilityState === 'visible') fetchBalance(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [!!user]); // restart only when logged-in state changes, not on every user update

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
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

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser((prev) => {
        const next = { ...prev, ...res.data };
        localStorage.setItem('panelng_user', JSON.stringify(next));
        return next;
      });
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
