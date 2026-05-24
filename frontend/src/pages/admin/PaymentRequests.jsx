import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'rejected', label: 'Rejected' },
];

export default function PaymentRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { id, reference }
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/payment-requests${filter !== 'all' ? `?status=${filter}` : ''}`);
      setRequests(res.data || []);
    } catch {
      toast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleConfirm = async (req) => {
    if (!window.confirm(`Confirm ₦${Number(req.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })} for ${req.users?.full_name}?\n\nThis will credit their wallet immediately.`)) return;
    setActionId(req.id);
    try {
      await api.patch(`/admin/payment-requests/${req.id}/confirm`);
      toast.success(`Confirmed — ₦${Number(req.amount).toLocaleString('en-NG')} credited`);
      setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: 'confirmed' } : r));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectOpen = (req) => {
    setRejectModal({ id: req.id, reference: req.reference });
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setActionId(rejectModal.id);
    try {
      await api.patch(`/admin/payment-requests/${rejectModal.id}/reject`, { reason: rejectReason });
      toast.success('Request rejected');
      setRequests((prev) => prev.map((r) => r.id === rejectModal.id ? { ...r, status: 'rejected' } : r));
      setRejectModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    } finally {
      setActionId(null);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const displayList = requests;

  const statusStyle = (s) => {
    if (s === 'confirmed') return { color: 'var(--green)', background: 'rgba(14,201,127,0.1)', border: '1px solid rgba(14,201,127,0.3)' };
    if (s === 'rejected') return { color: 'var(--red)', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)' };
    return { color: 'var(--primary)', background: 'var(--primary-muted)', border: '1px solid var(--primary-border)' };
  };

  return (
    <div className="dash-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Payment Requests
            {pendingCount > 0 && (
              <span style={{ background: 'var(--primary)', color: '#000', borderRadius: 20, fontSize: 12, fontWeight: 800, padding: '2px 10px', minWidth: 26, textAlign: 'center' }}>
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="page-subtitle">Review and confirm manual bank deposits</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            style={{ fontSize: 12 }}
          >
            {f.label}
            {f.key === 'pending' && pendingCount > 0 && (
              <span style={{ marginLeft: 4, background: filter === 'pending' ? 'rgba(0,0,0,0.3)' : 'var(--primary)', color: filter === 'pending' ? '#000' : '#000', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><span className="spinner" /></div>
      ) : displayList.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 0' }}>
          <Clock size={32} />
          <h3>No {filter !== 'all' ? filter : ''} requests</h3>
          <p>Payment requests will appear here when customers submit them</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayList.map((r) => (
            <div
              key={r.id}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                borderLeft: r.status === 'pending' ? '3px solid var(--primary)' : r.status === 'confirmed' ? '3px solid var(--green)' : '3px solid var(--red)',
              }}
            >
              {/* Customer info */}
              <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.users?.full_name || 'Unknown'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.users?.email}
                </div>
              </div>

              {/* Amount */}
              <div style={{ flex: '0 0 120px', textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>₦{fmt(r.amount)}</div>
              </div>

              {/* Reference */}
              <div style={{ flex: '1 1 140px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Reference</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.04em' }}>{r.reference}</div>
              </div>

              {/* Time */}
              <div style={{ flex: '1 1 120px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Time</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(r.created_at)}</div>
              </div>

              {/* Status */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 4, padding: '4px 10px', ...statusStyle(r.status) }}>
                  {r.status}
                </span>
              </div>

              {/* Actions */}
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleConfirm(r)}
                    disabled={actionId === r.id}
                    style={{ background: 'rgba(14,201,127,0.15)', color: 'var(--green)', border: '1px solid rgba(14,201,127,0.3)', fontWeight: 700, fontSize: 12 }}
                  >
                    {actionId === r.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <CheckCircle size={13} />}
                    Confirm
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleRejectOpen(r)}
                    disabled={actionId === r.id}
                    style={{ background: 'rgba(255,77,77,0.1)', color: 'var(--red)', border: '1px solid rgba(255,77,77,0.3)', fontWeight: 700, fontSize: 12 }}
                  >
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 28, maxWidth: 420, width: '100%' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
              <AlertCircle size={22} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Reject Request</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Rejecting <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 700 }}>{rejectModal.reference}</span> — the customer's wallet will NOT be credited.
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Reason (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Payment not received"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-sm"
                style={{ flex: 1, background: 'rgba(255,77,77,0.15)', color: 'var(--red)', border: '1px solid rgba(255,77,77,0.4)', fontWeight: 700 }}
                onClick={handleRejectConfirm}
                disabled={!!actionId}
              >
                {actionId ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <XCircle size={13} />}
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
