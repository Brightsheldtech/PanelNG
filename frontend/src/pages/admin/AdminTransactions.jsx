import { useEffect, useState } from 'react';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const LIMIT = 30;

  const load = async (reset = true) => {
    setLoading(true);
    const offset = reset ? 0 : page * LIMIT;
    try {
      const res = await api.get(`/admin/transactions?limit=${LIMIT}&offset=${offset}`);
      const data = res.data.transactions || [];
      setTransactions(reset ? data : (prev) => [...prev, ...data]);
      setTotal(res.data.total || 0);
      if (reset) setPage(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(true); }, []);

  const filtered = typeFilter === 'all' ? transactions : transactions.filter((t) => t.type === typeFilter);
  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="dash-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">All Transactions</h1>
          <p className="page-subtitle">{total} total transactions</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => load(true)} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid-2 mb-6" style={{ marginBottom: 20, maxWidth: 480 }}>
        <div className="stat-card green" style={{ padding: 16 }}>
          <div className="stat-label">Total Credits</div>
          <div className="stat-value" style={{ fontSize: 18 }}>₦{fmt(totalCredits)}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-label">Total Debits</div>
          <div className="stat-value" style={{ fontSize: 18, color: 'var(--red)' }}>₦{fmt(totalDebits)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 4, width: 'fit-content' }}>
        {[['all', 'All'], ['credit', 'Credits'], ['debit', 'Debits']].map(([val, label]) => (
          <button key={val} onClick={() => setTypeFilter(val)} style={{ padding: '5px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', background: typeFilter === val ? 'var(--primary)' : 'transparent', color: typeFilter === val ? '#000' : 'var(--text-muted)', fontSize: 13, fontWeight: typeFilter === val ? 700 : 500 }}>
            {label}
          </button>
        ))}
      </div>

      {loading && transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="td-mono td-muted" style={{ fontSize: 11 }}>{t.reference}</td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.users?.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.users?.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: t.type === 'credit' ? 'var(--green-muted)' : 'var(--red-muted)', color: t.type === 'credit' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t.type}
                      </span>
                    </td>
                    <td className="td-mono" style={{ color: t.type === 'credit' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                      {t.type === 'credit' ? '+' : '-'}₦{fmt(t.amount)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 260 }}>{t.description}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <ArrowLeftRight size={28} />
                <h3>No transactions</h3>
                <p>No {typeFilter !== 'all' ? typeFilter : ''} transactions found</p>
              </div>
            )}
          </div>
        </div>
      )}
      {transactions.length < total && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-outline" onClick={() => { setPage((p) => p + 1); load(false); }} disabled={loading}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
