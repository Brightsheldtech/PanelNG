import { useEffect, useState } from 'react';
import { Clock, RefreshCw, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase().replace(/\s/g, '_');
  return <span className={`badge badge-${s}`}>{s.replace(/_/g, ' ')}</span>;
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const fetchOrders = async (reset = false) => {
    setLoading(true);
    const offset = reset ? 0 : page * LIMIT;
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (filter !== 'all') params.set('type', filter);
      const res = await api.get(`/orders?${params}`);
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

  useEffect(() => { fetchOrders(true); }, [filter]);

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="dash-page">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-brand)', fontSize: 20, fontWeight: 700,
            color: 'var(--text)', marginBottom: 2,
          }}>
            Order History
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
            {total} total orders
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => fetchOrders(true)} disabled={loading}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filter tabs — active = surface bg + border (not gold) */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16,
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 4, width: 'fit-content',
      }}>
        {[['all', 'All'], ['smm', 'SMM'], ['sms', 'SMS']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
              background: filter === val ? 'var(--surface)' : 'transparent',
              border: filter === val ? '1px solid var(--border2)' : '1px solid transparent',
              color: filter === val ? 'var(--text)' : 'var(--text2)',
              fontSize: 13, fontWeight: filter === val ? 600 : 400,
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <Clock size={28} />
          <h3>No orders found</h3>
          <p>Place your first order to see it here</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {orders.map((o, i) => (
              <div
                key={o.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 60px 1fr 60px',
                  alignItems: 'center',
                  padding: '13px 16px',
                  gap: 10,
                  borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Col 1: Date */}
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                  {fmtDate(o.created_at)}
                </div>

                {/* Col 2: Type badge */}
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 7px',
                    borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.5px',
                    fontFamily: 'var(--font-body)',
                    background: o.type === 'smm' ? 'rgba(232,160,32,0.12)' : 'rgba(59,130,246,0.12)',
                    color: o.type === 'smm' ? 'var(--gold)' : '#60a5fa',
                  }}>
                    {o.type}
                  </span>
                </div>

                {/* Col 3: Service + status + amount */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 2,
                  }}>
                    {o.type === 'sms'
                      ? (o.platform ? o.platform.charAt(0).toUpperCase() + o.platform.slice(1) : '—')
                      : (o.service_name || o.platform || '—')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <StatusBadge status={o.status} />
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11,
                      color: 'var(--red)', fontWeight: 400,
                    }}>
                      ₦{fmt(o.amount_paid)}
                    </span>
                    {o.type === 'sms' && o.phone_number && (
                      <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                        {o.phone_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Col 4: Qty or SMS code */}
                <div style={{ textAlign: 'right' }}>
                  {o.type === 'sms' && o.sms_code ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 400, color: 'var(--gold)' }}>
                        {o.sms_code}
                      </span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(o.sms_code); toast.success('Code copied!'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  ) : o.type === 'sms' ? (
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 400, color: 'var(--gold)' }}>
                      {o.quantity ? o.quantity.toLocaleString() : '—'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {orders.length < total && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                className="btn btn-outline"
                onClick={() => { setPage((p) => p + 1); fetchOrders(false); }}
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
