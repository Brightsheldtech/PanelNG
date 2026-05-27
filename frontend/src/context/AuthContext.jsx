import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const BALANCE_POLL_MS = 15000;
const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVE_KEY = 'panelng_last_active';

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

  // Inactivity timeout — logout after 30 min with no interaction
  useEffect(() => {
    if (!user) return;

    const touch = () => localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    const check = () => {
      const last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0', 10);
      if (last && Date.now() - last > INACTIVITY_MS) {
        localStorage.removeItem(LAST_ACTIVE_KEY);
        logout();
      }
    };

    touch(); // record activity on mount / login

    const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));

    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(check, 60 * 1000); // check every minute

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [!!user, logout]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { user, token } = res.data;
    localStorage.setItem('panelng_token', token);
    localStorage.setItem('panelng_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (email, full_name, password, referral_code) => {
    const res = await api.post('/auth/register', { email, full_name, password, ...(referral_code && { referral_code }) });
    const { user, token } = res.data;
    localStorage.setItem('panelng_token', token);
    localStorage.setItem('panelng_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const setSession = useCallback(({ user, token }) => {
    localStorage.setItem('panelng_token', token);
    localStorage.setItem('panelng_user', JSON.stringify(user));
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('panelng_token');
    localStorage.removeItem('panelng_user');
    localStorage.removeItem(LAST_ACTIVE_KEY);
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
