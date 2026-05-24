import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    api.get('/wallet/balance').then((r) => setBalance(r.data.balance)).catch(() => {});
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  return (
    <div className="app-shell">
      {/* Drawer overlay */}
      <div
        className={`drawer-overlay${open ? ' show' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />

      {/* Topbar — always visible */}
      <header className="topbar">
        <button className="topbar-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div className="topbar-brand">
          <div className="topbar-brand-mark">P</div>
          <span className="topbar-brand-name">PanelNG</span>
        </div>
        {balance !== null && (
          <div className="topbar-balance">
            <span className="topbar-balance-label">Balance</span>
            <span className="topbar-balance-amount">₦{fmt(balance)}</span>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
