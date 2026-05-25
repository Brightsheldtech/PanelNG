import { useEffect, useState } from 'react';
import { Users, Search, RefreshCw, RotateCcw } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refundModal, setRefundModal] = useState(null); // { user }
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/users')
      .then((r) => setUsers(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-NG');

  const openRefund = (user) => {
    setRefundModal({ user });
    setRefundAmount('');
    setRefundReason('');
  };

  const handleRefund = async () => {
    if (!refundModal || refunding) return;
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setRefunding(true);
    try {
      const { data } = await api.post('/admin/refund', {
        user_id: refundModal.user.id,
        amount,
        reason: refundReason || 'Manual credit',
      });
      toast.success(`₦${fmt(amount)} credited to ${refundModal.user.full_name}`);
      setUsers((prev) => prev.map((u) => u.id === refundModal.user.id ? { ...u, wallet_balance: data.new_balance } : u));
      setRefundModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue credit');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="dash-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">All Users</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Wallet Balance</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                  <td className="td-mono" style={{ color: 'var(--primary)' }}>₦{fmt(u.wallet_balance)}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: u.role === 'admin' ? 'var(--primary-muted)' : 'var(--surface)', color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid var(--border)' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(u.created_at)}</td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => openRefund(u)}
                        title="Credit / Refund wallet"
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
          {filtered.length === 0 && (
            <div className="empty-state">
              <Users size={28} />
              <h3>No users found</h3>
              <p>Try adjusting your search</p>
            </div>
          )}
        </div>
      )}

      {/* Refund / Credit modal */}
      {refundModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <RotateCcw size={18} style={{ color: 'var(--red, #DC2626)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Credit Wallet</h3>
            </div>

            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>{refundModal.user.full_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{refundModal.user.email}</div>
              <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                Current balance: <strong style={{ color: 'var(--text)' }}>₦{fmt(refundModal.user.wallet_balance)}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Amount to Credit (₦)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                min={1}
                placeholder="0.00"
                style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Reason</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Refund for failed order, compensation…"
                style={{ width: '100%', padding: '9px 12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRefundModal(null)} disabled={refunding} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                Cancel
              </button>
              <button onClick={handleRefund} disabled={refunding || !refundAmount || parseFloat(refundAmount) <= 0} style={{ flex: 2, padding: '10px', background: 'var(--red, #DC2626)', border: 'none', borderRadius: 8, cursor: refunding ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)', opacity: refunding ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {refunding ? <><span className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> Processing…</> : <><RotateCcw size={14} /> Credit Wallet</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
