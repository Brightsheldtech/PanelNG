import { useEffect, useState } from 'react';
import { ShoppingCart, RefreshCw, Copy, RotateCcw } from 'lucide-react';
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
  const [refundModal, setRefundModal] = useState(null); // { order }
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

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

  const openRefund = (order) => {
    setRefundModal({ order });
    setRefundAmount(String(order.amount_paid || ''));
    setRefundReason('');
  };

  const handleRefund = async () => {
    if (!refundModal || refunding) return;
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setRefunding(true);
    try {
      await api.post('/admin/refund', {
        user_id: refundModal.order.user_id,
        amount,
        reason: refundReason || `${refundModal.order.type?.toUpperCase()} order refund`,
        order_id: refundModal.order.id,
        order_type: refundModal.order.type,
      });
      toast.success(`₦${fmt(amount)} refunded to ${refundModal.order.users?.full_name || 'user'}`);
      setOrders((prev) => prev.map((o) => o.id === refundModal.order.id ? { ...o, status: 'refunded' } : o));
      setRefundModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

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
                    <th></th>
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
                      <td>
                        {o.status !== 'refunded' && (
                          <button
                            onClick={() => openRefund(o)}
                            title="Issue refund"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--red-dim, rgba(220,38,38,.08))', border: '1px solid var(--red-border, rgba(220,38,38,.2))', borderRadius: 6, color: 'var(--red, #DC2626)', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}
                          >
                            <RotateCcw size={12} /> Refund
                          </button>
                        )}
                      </td>
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

      {/* Refund modal */}
      {refundModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <RotateCcw size={18} style={{ color: 'var(--red, #DC2626)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Issue Refund</h3>
            </div>

            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>{refundModal.order.users?.full_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{refundModal.order.users?.email}</div>
              <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                {refundModal.order.type?.toUpperCase()} · {refundModal.order.service_name || refundModal.order.platform} · Original: <strong style={{ color: 'var(--text)' }}>₦{fmt(refundModal.order.amount_paid)}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Refund Amount (₦)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                min={1}
                max={refundModal.order.amount_paid}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Reason (optional)</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Order failed, duplicate charge…"
                style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRefundModal(null)} disabled={refunding} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                Cancel
              </button>
              <button onClick={handleRefund} disabled={refunding || !refundAmount || parseFloat(refundAmount) <= 0} style={{ flex: 2, padding: '10px', background: 'var(--red, #DC2626)', border: 'none', borderRadius: 8, cursor: refunding ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)', opacity: refunding ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {refunding ? <><span className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> Processing…</> : <><RotateCcw size={14} /> Issue Refund</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
