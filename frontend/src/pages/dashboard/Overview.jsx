import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ShoppingCart, TrendingDown, PlusCircle, Clock, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase().replace(' ', '_');
  return <span className={`badge badge-${s}`}>{s.replace('_', ' ')}</span>;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Overview() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(user?.wallet_balance || 0);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/wallet/balance'),
      api.get('/orders?limit=5'),
      api.get('/wallet/transactions?limit=5'),
    ])
      .then(([balRes, ordRes, txRes]) => {
        setBalance(balRes.data.balance);
        setOrders(ordRes.data.orders || []);
        setTransactions(txRes.data.transactions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const rowBorder = (i, arr) =>
    i < arr.length - 1 ? '1px solid var(--border)' : 'none';

  return (
    <div className="dash-page">

      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-brand)', fontSize: 22, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4,
        }}>
          {greeting()}, {firstName} 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
          Here's what's happening on your account
        </p>
      </div>

      {/* Stat cards — stacked vertically */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <div className="stat-card primary">
          <div className="stat-icon primary"><Wallet size={17} /></div>
          <div className="stat-label" style={{ marginTop: 12 }}>Wallet Balance</div>
          <div className="stat-value" style={{ marginTop: 4 }}>₦{fmt(balance)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><ShoppingCart size={17} /></div>
          <div className="stat-label" style={{ marginTop: 12 }}>Total Orders</div>
          <div className="stat-value" style={{ marginTop: 4 }}>{orders.length}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><TrendingDown size={17} /></div>
          <div className="stat-label" style={{ marginTop: 12 }}>Total Spent</div>
          <div className="stat-value" style={{ marginTop: 4 }}>₦{fmt(totalSpent)}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link to="/dashboard/new-order" className="btn btn-primary btn-sm">
          <PlusCircle size={13} /> New SMM Order
        </Link>
        <Link to="/dashboard/sms" className="btn btn-outline btn-sm">
          Buy SMS Number
        </Link>
        <Link to="/dashboard/add-funds" className="btn btn-outline btn-sm">
          Add Funds
        </Link>
      </div>

      {/* Recent Orders */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="section-label" style={{ margin: 0 }}>Recent Orders</span>
          <Link to="/dashboard/orders" style={{
            fontSize: 12, color: 'var(--gold)',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-body)', fontWeight: 500,
          }}>
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 28 }}><span className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <Clock size={24} />
              <h3>No orders yet</h3>
              <p>Place your first order to see it here</p>
            </div>
          ) : (
            orders.map((o, i) => (
              <div key={o.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 18px', borderBottom: rowBorder(i, orders), gap: 12,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                    color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {o.service_name || o.platform}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    {o.type === 'sms'
                      ? o.phone_number
                      : `${o.quantity?.toLocaleString()} units · ₦${fmt(o.amount_paid)}`}
                  </div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="section-label" style={{ margin: 0 }}>Recent Transactions</span>
          <Link to="/dashboard/add-funds" style={{
            fontSize: 12, color: 'var(--gold)',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-body)', fontWeight: 500,
          }}>
            Add Funds <ArrowRight size={11} />
          </Link>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 28 }}><span className="spinner" /></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 20px' }}>
              <Wallet size={24} />
              <h3>No transactions yet</h3>
              <p>Fund your wallet to get started</p>
            </div>
          ) : (
            transactions.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 18px', borderBottom: rowBorder(i, transactions), gap: 12,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {t.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                    {new Date(t.created_at).toLocaleDateString('en-NG')}
                  </div>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 400, flexShrink: 0,
                  color: t.type === 'credit' ? 'var(--green)' : 'var(--red)',
                }}>
                  {t.type === 'credit' ? '+' : '-'}₦{fmt(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
