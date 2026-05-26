import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAdminGuard } from '../../hooks/useAdminGuard';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMoney(n) {
  return '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const PAGE_SIZE = 20;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@600;700;800&family=Epilogue:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  .au-page { background: #F8F7F4; min-height: 100vh; padding: 32px 40px; font-family: 'Epilogue', sans-serif; box-sizing: border-box; }
  .au-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .au-title { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 24px; color: #111110; margin: 0 0 3px; }
  .au-subtitle { font-size: 13px; color: #6B6860; margin: 0; }
  .au-export-btn { padding: 8px 16px; border: 1px solid #E5E2D9; background: white; border-radius: 9px; font-family: 'Epilogue', sans-serif; font-size: 13px; color: #6B6860; cursor: pointer; white-space: nowrap; transition: background 0.12s; }
  .au-export-btn:hover { background: #F8F7F4; }

  .au-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .au-search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
  .au-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .au-search-input { width: 100%; padding: 10px 14px 10px 36px; border: 1px solid #E5E2D9; border-radius: 11px; background: white; font-family: 'Epilogue', sans-serif; font-size: 14px; color: #111110; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
  .au-search-input::placeholder { color: #A8A49C; }
  .au-search-input:focus { border-color: #C9620A; }
  .au-select { padding: 10px 12px; border: 1px solid #E5E2D9; border-radius: 11px; background: white; font-family: 'Epilogue', sans-serif; font-size: 13px; color: #6B6860; outline: none; cursor: pointer; }
  .au-date-input { padding: 9px 12px; border: 1px solid #E5E2D9; border-radius: 11px; background: white; font-family: 'Epilogue', sans-serif; font-size: 13px; color: #6B6860; outline: none; }
  .au-clear-btn { font-size: 13px; color: #C9620A; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; white-space: nowrap; }

  .au-table-wrap { background: white; border: 1px solid #E5E2D9; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
  .au-table { width: 100%; border-collapse: collapse; }
  .au-thead { background: #F8F7F4; }
  .au-th { padding: 12px 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #A8A49C; text-align: left; border-bottom: 1px solid #E5E2D9; white-space: nowrap; }
  .au-td { padding: 16px 20px; border-bottom: 1px solid #E5E2D9; vertical-align: middle; }
  .au-tr:last-child .au-td { border-bottom: none; }
  .au-tr:hover { background: #FAFAF8; cursor: pointer; }

  .au-user-cell { display: flex; align-items: center; gap: 12px; }
  .au-avatar { width: 32px; height: 32px; border-radius: 10px; background: rgba(201,98,10,0.1); display: flex; align-items: center; justify-content: center; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 13px; color: #C9620A; flex-shrink: 0; }
  .au-user-name { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 600; font-size: 14px; color: #111110; }
  .au-user-uname { font-size: 12px; color: #A8A49C; }

  .au-email-cell { font-size: 13px; color: #6B6860; }
  .au-phone-cell { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #6B6860; }
  .au-balance-cell { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 500; color: #111110; }
  .au-date-cell { font-size: 12px; color: #A8A49C; }

  .au-pill { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 100px; white-space: nowrap; letter-spacing: 0.04em; text-transform: uppercase; }
  .au-pill-green { background: rgba(22,163,74,0.1); color: #16A34A; }
  .au-pill-red { background: rgba(220,38,38,0.08); color: #DC2626; }
  .au-pill-orange { background: rgba(201,98,10,0.1); color: #C9620A; }
  .au-pill-active { background: rgba(22,163,74,0.1); color: #16A34A; }
  .au-pill-suspended { background: rgba(220,38,38,0.08); color: #DC2626; }

  .au-actions { display: flex; gap: 6px; align-items: center; }
  .au-icon-btn { width: 32px; height: 32px; border-radius: 9px; border: 1px solid #E5E2D9; background: white; color: #6B6860; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.12s, color 0.12s; flex-shrink: 0; }
  .au-icon-btn:hover { background: #F8F7F4; }
  .au-icon-btn.red:hover { color: #DC2626; border-color: rgba(220,38,38,0.3); }
  .au-icon-btn.green:hover { color: #16A34A; border-color: rgba(22,163,74,0.3); }

  .au-shimmer { height: 16px; border-radius: 6px; background: linear-gradient(90deg, #F0EEE9 25%, #E8E5DE 50%, #F0EEE9 75%); background-size: 200% 100%; animation: au-shimmer 1.4s infinite; }
  @keyframes au-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .au-shimmer-row .au-td { padding: 20px 20px; }

  .au-empty { padding: 60px 20px; text-align: center; }
  .au-empty-icon { margin: 0 auto 12px; color: #A8A49C; display: flex; align-items: center; justify-content: center; }
  .au-empty-title { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 16px; color: #111110; margin: 0 0 4px; }
  .au-empty-sub { font-size: 13px; color: #6B6860; margin: 0; }

  .au-pagination { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .au-page-info { font-size: 13px; color: #6B6860; }
  .au-page-btns { display: flex; gap: 8px; }
  .au-page-btn { padding: 8px 16px; border: 1px solid #E5E2D9; background: white; border-radius: 9px; font-family: 'Epilogue', sans-serif; font-size: 13px; color: #6B6860; cursor: pointer; transition: background 0.12s; }
  .au-page-btn:hover:not(:disabled) { background: #F8F7F4; }
  .au-page-btn:disabled { opacity: 0.4; pointer-events: none; }

  /* Mobile cards */
  @media (max-width: 768px) {
    .au-page { padding: 20px 16px; }
    .au-table-wrap { display: none; }
    .au-card-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .au-mobile-card { background: white; border: 1px solid #E5E2D9; border-radius: 14px; padding: 16px; cursor: pointer; transition: background 0.1s; }
    .au-mobile-card:hover { background: #FAFAF8; }
    .au-mc-row1 { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .au-mc-name { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 600; font-size: 14px; color: #111110; flex: 1; }
    .au-mc-uname { font-size: 12px; color: #A8A49C; }
    .au-mc-email { font-size: 13px; color: #6B6860; margin-bottom: 4px; }
    .au-mc-phone { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #6B6860; margin-bottom: 8px; }
    .au-mc-row4 { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .au-mc-balance { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 500; color: #111110; }
    .au-mc-date { font-size: 12px; color: #A8A49C; }
    .au-mc-view { width: 100%; padding: 10px; border: 1px solid #E5E2D9; border-radius: 9px; background: white; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 600; font-size: 13px; color: #111110; cursor: pointer; transition: background 0.12s; }
    .au-mc-view:hover { background: #F8F7F4; }
  }
  @media (min-width: 769px) {
    .au-card-list { display: none; }
  }
`;

function SearchIcon() {
  return (
    <svg className="au-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function BanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const isAdmin = useAdminGuard();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const searchTimer = useRef(null);
  const hasFilters = search || statusFilter !== 'all' || fromDate || toDate;

  const fetchUsers = useCallback(async (currentPage, currentSearch, currentStatus, currentFrom, currentTo) => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, offset: currentPage * PAGE_SIZE };
      if (currentSearch) params.search = currentSearch;
      if (currentStatus && currentStatus !== 'all') params.status = currentStatus;
      if (currentFrom) params.from_date = currentFrom;
      if (currentTo) params.to_date = currentTo;

      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when page/filters change
  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers(page, search, statusFilter, fromDate, toDate);
  }, [page, statusFilter, fromDate, toDate, isAdmin]);

  // Debounce search
  useEffect(() => {
    if (!isAdmin) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(0);
      fetchUsers(0, search, statusFilter, fromDate, toDate);
    }, 300);
  }, [search]);

  const handleStatusToggle = async (e, userId, currentStatus) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch { /* ignore */ }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const exportCSV = () => {
    const headers = ['Full Name', 'Username', 'Email', 'Phone', 'Wallet Balance', 'Status', 'Email Verified', 'Date Joined'];
    const rows = users.map(u => [
      u.full_name || '',
      u.username || '',
      u.email || '',
      u.phone || '',
      Number(u.wallet_balance || 0).toFixed(2),
      u.status || 'active',
      u.email_verified ? 'Yes' : 'No',
      fmtDate(u.created_at),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panelng-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  if (isAdmin === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E5E2D9', borderTopColor: '#C9620A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="au-page">
        {/* Header */}
        <div className="au-header">
          <div>
            <h1 className="au-title">All Users</h1>
            <p className="au-subtitle">{total} total user{total !== 1 ? 's' : ''}</p>
          </div>
          <button className="au-export-btn" onClick={exportCSV}>Export CSV</button>
        </div>

        {/* Filters */}
        <div className="au-filters">
          <div className="au-search-wrap">
            <SearchIcon />
            <input
              className="au-search-input"
              type="text"
              placeholder="Search by name, username or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="au-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <input className="au-date-input" type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(0); }} title="From date" />
          <input className="au-date-input" type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(0); }} title="To date" />
          {hasFilters && <button className="au-clear-btn" onClick={clearFilters}>Clear</button>}
        </div>

        {/* Desktop table */}
        <div className="au-table-wrap">
          <table className="au-table">
            <thead className="au-thead">
              <tr>
                <th className="au-th">User</th>
                <th className="au-th">Email</th>
                <th className="au-th">Phone</th>
                <th className="au-th">Wallet</th>
                <th className="au-th">Status</th>
                <th className="au-th">Joined</th>
                <th className="au-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="au-shimmer-row">
                    {[180, 160, 120, 100, 80, 90, 60].map((w, j) => (
                      <td key={j} className="au-td"><div className="au-shimmer" style={{ width: w }} /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="au-empty">
                      <div className="au-empty-icon"><UsersIcon /></div>
                      <p className="au-empty-title">No users found</p>
                      <p className="au-empty-sub">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="au-tr" onClick={() => navigate(`/admin/users/${u.id}`)}>
                    <td className="au-td">
                      <div className="au-user-cell">
                        <div className="au-avatar">{getInitials(u.full_name)}</div>
                        <div>
                          <div className="au-user-name">{u.full_name}</div>
                          {u.username && <div className="au-user-uname">@{u.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="au-td">
                      <div className="au-email-cell">{u.email}</div>
                      <span className={`au-pill ${u.email_verified ? 'au-pill-green' : 'au-pill-red'}`} style={{ marginTop: 4, display: 'inline-flex' }}>
                        {u.email_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="au-td au-phone-cell">{u.phone || '—'}</td>
                    <td className="au-td au-balance-cell">{fmtMoney(u.wallet_balance)}</td>
                    <td className="au-td">
                      <span className={`au-pill ${(u.status || 'active') === 'suspended' ? 'au-pill-suspended' : 'au-pill-active'}`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="au-td au-date-cell">{fmtDate(u.created_at)}</td>
                    <td className="au-td">
                      <div className="au-actions">
                        <button className="au-icon-btn" title="View user" onClick={e => { e.stopPropagation(); navigate(`/admin/users/${u.id}`); }}>
                          <EyeIcon />
                        </button>
                        <button
                          className={`au-icon-btn ${(u.status || 'active') === 'suspended' ? 'green' : 'red'}`}
                          title={(u.status || 'active') === 'suspended' ? 'Activate account' : 'Suspend account'}
                          onClick={e => handleStatusToggle(e, u.id, u.status || 'active')}
                        >
                          {(u.status || 'active') === 'suspended' ? <CheckCircleIcon /> : <BanIcon />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="au-card-list">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #E5E2D9', borderRadius: 14, padding: 16 }}>
                <div className="au-shimmer" style={{ width: '60%', marginBottom: 8 }} />
                <div className="au-shimmer" style={{ width: '40%', marginBottom: 8 }} />
                <div className="au-shimmer" style={{ width: '80%' }} />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="au-empty">
              <div className="au-empty-icon"><UsersIcon /></div>
              <p className="au-empty-title">No users found</p>
              <p className="au-empty-sub">Try adjusting your search or filters.</p>
            </div>
          ) : (
            users.map(u => (
              <div key={u.id} className="au-mobile-card" onClick={() => navigate(`/admin/users/${u.id}`)}>
                <div className="au-mc-row1">
                  <div className="au-avatar">{getInitials(u.full_name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="au-mc-name">{u.full_name}</div>
                    {u.username && <div className="au-mc-uname">@{u.username}</div>}
                  </div>
                  <span className={`au-pill ${(u.status || 'active') === 'suspended' ? 'au-pill-suspended' : 'au-pill-active'}`}>
                    {u.status || 'Active'}
                  </span>
                </div>
                <div className="au-mc-email">
                  {u.email}{' '}
                  <span className={`au-pill ${u.email_verified ? 'au-pill-green' : 'au-pill-red'}`}>
                    {u.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="au-mc-phone">{u.phone || '—'}</div>
                <div className="au-mc-row4">
                  <span className="au-mc-balance">{fmtMoney(u.wallet_balance)}</span>
                  <span className="au-mc-date">{fmtDate(u.created_at)}</span>
                </div>
                <button className="au-mc-view" onClick={e => { e.stopPropagation(); navigate(`/admin/users/${u.id}`); }}>View Profile</button>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="au-pagination">
            <span className="au-page-info">
              Showing {from}–{to} of {total} user{total !== 1 ? 's' : ''}
            </span>
            <div className="au-page-btns">
              <button className="au-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Previous</button>
              <button className="au-page-btn" onClick={() => setPage(p => p + 1)} disabled={to >= total}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
