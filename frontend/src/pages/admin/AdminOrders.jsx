import { useEffect, useState } from 'react';
import { ShoppingCart, RefreshCw, Copy } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase().replace(/\s/g, '_');
  return <span className={`badge badge-${s}`}>{s.replace(/_/g, ' ')}</span>;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const LIMIT = 50;

  const load = async (reset = true) => {
    setLoading(true);
    const offset = reset ? 0 : page * LIMIT;
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (filter !== 'all') params.set('type', filter);
      const res = await api.get(`/admin/orders?${params}`);
      const data = res.data.orders || [];
      setOrders(reset ? data : (prev) => [...prev, ...data]);
      setTotal(res.data.total || 0);
      if (reset) setPage(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(true); }, [filter]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="dash-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">All Orders</h1>
          <p className="page-subtitle">{total} total orders across all users</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => load(true)} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 4, width: 'fit-content' }}>
        {[['all', 'All'], ['smm', 'SMM'], ['sms', 'SMS']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              padding: '6px 16px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: filter === val ? 'var(--primary)' : 'transparent',
              color: filter === val ? '#000' : 'var(--text-muted)',
              fontSize: 13, fontWeight: filter === val ? 700 : 500,
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={36} />
          <h3>No orders yet</h3>
          <p>Orders will appear here as users place them</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Service / Number</th>
                    <th>Qty / Code</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="td-mono td-muted" style={{ fontSize: 11 }}>{o.id.slice(0, 8)}…</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{o.users?.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.users?.email}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: o.type === 'smm' ? 'var(--blue-muted)' : 'var(--purple-muted)', color: o.type === 'smm' ? 'var(--blue)' : 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {o.type}
                        </span>
                      </td>
                      <td>
                        {o.type === 'sms' ? (
                          <>
                            <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{o.platform}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{o.phone_number}</div>
                            {o.country && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{o.country}</div>}
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 13 }}>{o.service_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.platform}</div>
                          </>
                        )}
                      </td>
                      <td>
                        {o.type === 'sms' ? (
                          o.sms_code ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>{o.sms_code}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(o.sms_code); toast.success('Copied!'); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          ) : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>pending</span>
                        ) : (
                          <span className="td-mono">{o.quantity?.toLocaleString() || '—'}</span>
                        )}
                      </td>
                      <td className="td-mono" style={{ color: 'var(--red)', fontWeight: 700 }}>₦{fmt(o.amount_paid)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {orders.length < total && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                className="btn btn-outline"
                onClick={() => { setPage((p) => p + 1); load(false); }}
                disabled={loading}
              >
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
