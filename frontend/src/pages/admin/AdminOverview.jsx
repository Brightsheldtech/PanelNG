import { useEffect, useState } from 'react';
import { Users, ShoppingCart, TrendingUp, MessageSquare, RefreshCw, Zap, AlertCircle, DollarSign } from 'lucide-react';
import api from '../../lib/api';

export default function AdminOverview() {
  const [stats, setStats] = useState({ total_users: 0, total_orders: 0, sms_orders: 0, total_revenue: 0, sms_revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentSms, setRecentSms] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiBalances, setApiBalances] = useState({ jap: null, herosms: null });
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [rate, setRate] = useState('');
  const [rateSaved, setRateSaved] = useState(false);
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState('');

  const loadBalances = async () => {
    setBalancesLoading(true);
    const [japRes, smsRes] = await Promise.allSettled([
      api.get('/smm/balance'),
      api.get('/sms/balance'),
    ]);
    setApiBalances({
      jap: japRes.status === 'fulfilled' ? japRes.value.data : null,
      herosms: smsRes.status === 'fulfilled' ? smsRes.value.data : null,
    });
    setBalancesLoading(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, smsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/orders?limit=5'),
        api.get('/admin/sms-orders?limit=5'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.orders || []);
      setRecentSms(smsRes.data.orders || []);
      setRecentUsers((usersRes.data || []).slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRate = async () => {
    try {
      const { data } = await api.get('/settings/exchange-rate');
      setRate(String(data.value || '1600'));
    } catch { setRate('1600'); }
  };

  const saveRate = async () => {
    const val = Number(rate);
    if (!val || val <= 0) { setRateError('Enter a valid rate greater than 0'); return; }
    setRateSaving(true); setRateError('');
    try {
      await api.put('/settings/exchange-rate', { value: String(val) });
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2500);
    } catch (err) {
      setRateError(err.response?.data?.error || 'Failed to save rate');
    } finally { setRateSaving(false); }
  };

  useEffect(() => { load(); loadBalances(); loadRate(); }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  return (
    <div className="dash-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => { load(); loadBalances(); }} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="stat-card primary">
          <div className="stat-icon primary"><Users size={16} /></div>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{loading ? '—' : stats.total_users.toLocaleString()}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><ShoppingCart size={16} /></div>
          <div className="stat-label">SMM Orders</div>
          <div className="stat-value">{loading ? '—' : stats.total_orders.toLocaleString()}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><MessageSquare size={16} /></div>
          <div className="stat-label">SMS Orders</div>
          <div className="stat-value">{loading ? '—' : stats.sms_orders.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--yellow-border)', background: 'var(--yellow-muted)' }}>
          <div className="stat-icon" style={{ background: 'rgba(255,180,0,0.15)', color: '#F5A623' }}><TrendingUp size={16} /></div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: 18 }}>₦{loading ? '—' : fmt(stats.total_revenue)}</div>
          {!loading && stats.sms_revenue > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              incl. ₦{fmt(stats.sms_revenue)} SMS
            </div>
          )}
        </div>
      </div>

      {/* API Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* JAP Balance */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={17} color="#6366F1" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 3 }}>JAP Panel Balance</div>
            {balancesLoading ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : apiBalances.jap ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                ${Number(apiBalances.jap.balance ?? 0).toFixed(2)}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--red)', fontSize: 12 }}>
                <AlertCircle size={13} /> Failed to fetch
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>justanotherpanel.com</div>
          </div>
        </div>

        {/* HeroSMS Balance */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={17} color="#10B981" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 3 }}>HeroSMS Balance</div>
            {balancesLoading ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : apiBalances.herosms ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                ${Number(apiBalances.herosms.balance ?? 0).toFixed(2)}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--red)', fontSize: 12 }}>
                <AlertCircle size={13} /> Failed to fetch
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>hero-sms.com</div>
          </div>
        </div>
      </div>

      {/* Exchange Rate */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={17} color="#F5A623" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Today's USD → NGN Rate</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Used to convert ACCSZONE prices for buyers</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rate (₦ per $1)</div>
            <input
              type="number"
              min="1"
              step="1"
              value={rate}
              onChange={e => { setRate(e.target.value); setRateError(''); setRateSaved(false); }}
              placeholder="e.g. 1600"
              style={{ height: 40, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', fontSize: 15, fontFamily: 'var(--font-mono)', color: 'var(--text)', outline: 'none', width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 0, marginTop: 22 }}>
            <button
              onClick={saveRate}
              disabled={rateSaving}
              style={{ height: 40, padding: '0 20px', background: rateSaved ? 'rgba(16,185,129,0.12)' : 'var(--accent, #F5A623)', color: rateSaved ? '#10B981' : '#fff', border: rateSaved ? '1px solid rgba(16,185,129,0.3)' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: rateSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, opacity: rateSaving ? 0.7 : 1 }}
            >
              {rateSaving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : rateSaved ? <><span>✓</span> Saved</> : 'Save Rate'}
            </button>
          </div>
        </div>
        {rateError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{rateError}</div>}
        {rate && Number(rate) > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            Example: $5 account → <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 600 }}>₦{(5 * Number(rate)).toLocaleString('en-NG')}</span>
          </div>
        )}
      </div>

      {/* Recent tables */}
      <div className="grid-2">
        {/* Recent SMM Orders */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent SMM Orders</span>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 24 }}><span className="spinner" /></div> : (
            <div>
              {recentOrders.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No orders yet</p>
                : recentOrders.map((o) => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{o.service_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.users?.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>₦{fmt(o.amount_paid)}</div>
                      <span className={`badge badge-${o.status}`} style={{ fontSize: 10 }}>{o.status}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Recent SMS Orders */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent SMS Orders</span>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 24 }}><span className="spinner" /></div> : (
            <div>
              {recentSms.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No SMS orders yet</p>
                : recentSms.map((o) => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{o.platform}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{o.phone_number}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.users?.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>₦{fmt(o.amount_paid)}</div>
                      <span className={`badge badge-${o.status}`} style={{ fontSize: 10 }}>{o.status}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Users</span>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 24 }}><span className="spinner" /></div> : (
            <div>
              {recentUsers.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No users yet</p>
                : recentUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--primary)' }}>₦{fmt(u.wallet_balance)}</div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{u.role}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
