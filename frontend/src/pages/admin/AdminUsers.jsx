import { useEffect, useState } from 'react';
import { Users, Search, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    </div>
  );
}
