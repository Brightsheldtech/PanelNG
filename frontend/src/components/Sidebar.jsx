import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, MessageSquare, Clock,
  Wallet, User, Users, ShoppingCart, ArrowLeftRight,
  Settings, LogOut, Shield, X, Banknote, Building2, Phone, ShoppingBag, HeadphonesIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(user?.wallet_balance ?? 0);

  useEffect(() => {
    api.get('/wallet/balance').then((r) => setBalance(r.data.balance)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { to: '/dashboard/overview',  icon: LayoutDashboard, label: 'Overview' },
    { to: '/dashboard/new-order', icon: PlusCircle,       label: 'New SMM Order' },
    { to: '/dashboard/sms',       icon: MessageSquare,    label: 'SMS Verify' },
    { to: '/dashboard/orders',    icon: Clock,            label: 'Order History' },
    { to: '/dashboard/add-funds', icon: Wallet,           label: 'Add Funds' },
    { to: '/dashboard/profile',   icon: User,             label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin/overview',          icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users',             icon: Users,           label: 'All Users' },
    { to: '/admin/orders',            icon: ShoppingCart,    label: 'All Orders' },
    { to: '/admin/transactions',      icon: ArrowLeftRight,  label: 'Transactions' },
    { to: '/admin/payment-requests',  icon: Banknote,        label: 'Payment Requests' },
    { to: '/admin/services',          icon: Settings,        label: 'Services Manager' },
    { to: '/admin/sms-manager',       icon: Phone,           label: 'SMS Manager' },
    { to: '/admin/accszone',          icon: ShoppingBag,     label: 'Accounts Manager' },
    { to: '/admin/bank-settings',     icon: Building2,        label: 'Bank Settings' },
    { to: '/admin/support',           icon: HeadphonesIcon,   label: 'Support' },
  ];

  const initials = user?.full_name
    ?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>

      {/* Brand + close */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">P</div>
        <span className="sidebar-brand-name">PanelNG</span>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      {/* Balance card */}
      <div className="sidebar-wallet">
        <div className="sidebar-wallet-label">Wallet Balance</div>
        <div className="sidebar-wallet-amount">₦{fmt(balance)}</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">Menu</div>
        {userLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="nav-section" style={{ marginTop: 8 }}>
              <Shield size={9} /> Admin
            </div>
            {adminLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-user-name">{user?.full_name || 'User'}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px',
            background: 'transparent',
            border: '1px solid rgba(240,68,56,0.2)',
            borderRadius: 8,
            color: 'var(--red)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-dim)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
