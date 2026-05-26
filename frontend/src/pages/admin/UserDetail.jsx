import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@600;700;800&family=Epilogue:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  .ud-page { background: #F8F7F4; min-height: 100vh; padding: 32px 40px; font-family: 'Epilogue', sans-serif; box-sizing: border-box; }
  .ud-back { display: inline-flex; align-items: center; gap: 6px; color: #6B6860; font-size: 13px; text-decoration: none; margin-bottom: 20px; cursor: pointer; background: none; border: none; padding: 0; }
  .ud-back:hover { color: #111110; }

  .ud-card { background: white; border: 1px solid #E5E2D9; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
  .ud-section-title { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 600; font-size: 16px; color: #111110; margin: 0 0 16px; }

  /* Profile header */
  .ud-profile-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  .ud-avatar-lg { width: 64px; height: 64px; border-radius: 18px; background: rgba(201,98,10,0.1); display: flex; align-items: center; justify-content: center; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 24px; color: #C9620A; flex-shrink: 0; }
  .ud-profile-info { flex: 1; min-width: 0; }
  .ud-profile-name { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 20px; color: #111110; margin: 0; }
  .ud-profile-uname { font-size: 13px; color: #A8A49C; margin-top: 2px; }
  .ud-profile-email { font-size: 13px; color: #6B6860; margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ud-profile-phone { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #6B6860; margin-top: 4px; }
  .ud-profile-ref { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #A8A49C; margin-top: 4px; }
  .ud-profile-joined { font-size: 12px; color: #A8A49C; margin-top: 4px; }
  .ud-profile-actions { display: flex; flex-direction: column; gap: 8px; }

  .ud-pill { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 100px; white-space: nowrap; }
  .ud-pill-green { background: rgba(22,163,74,0.1); color: #16A34A; }
  .ud-pill-red { background: rgba(220,38,38,0.08); color: #DC2626; }
  .ud-pill-active { background: rgba(22,163,74,0.1); color: #16A34A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 9px; }
  .ud-pill-suspended { background: rgba(220,38,38,0.08); color: #DC2626; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 9px; }

  .ud-action-btn { padding: 9px 16px; border-radius: 9px; font-family: 'Epilogue', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.12s; white-space: nowrap; }
  .ud-suspend-btn { border: 1px solid #FCA5A5; color: #DC2626; background: white; }
  .ud-suspend-btn:hover { background: rgba(220,38,38,0.04); }
  .ud-activate-btn { border: 1px solid #86EFAC; color: #16A34A; background: white; }
  .ud-activate-btn:hover { background: rgba(22,163,74,0.04); }

  .ud-confirm-inline { margin-top: 8px; padding: 12px; background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 10px; font-size: 13px; color: #DC2626; }
  .ud-confirm-inline p { margin: 0 0 10px; }
  .ud-confirm-btns { display: flex; gap: 8px; }
  .ud-confirm-yes { padding: 7px 14px; background: #DC2626; color: white; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .ud-confirm-no { padding: 7px 14px; background: white; border: 1px solid #E5E2D9; border-radius: 7px; font-size: 13px; color: #6B6860; cursor: pointer; }

  /* Wallet card */
  .ud-wallet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .ud-adjust-link { font-size: 13px; color: #C9620A; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; }
  .ud-wallet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .ud-wallet-stat { background: #F8F7F4; border-radius: 12px; padding: 14px 16px; }
  .ud-wallet-label { font-size: 11px; font-weight: 600; color: #A8A49C; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .ud-wallet-value { font-family: 'JetBrains Mono', monospace; font-weight: 500; }
  .ud-wallet-value-lg { font-size: 22px; color: #111110; }
  .ud-wallet-value-md { font-size: 18px; }
  .ud-wallet-value-green { color: #16A34A; }
  .ud-wallet-value-red { color: #DC2626; }

  /* Adjust modal */
  .ud-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
  .ud-modal { background: white; border-radius: 16px; padding: 28px; width: 100%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .ud-modal-title { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 18px; color: #111110; margin: 0 0 16px; }
  .ud-modal-balance { font-family: 'JetBrains Mono', monospace; font-size: 22px; color: #111110; text-align: center; margin-bottom: 20px; }
  .ud-tab-row { display: flex; gap: 6px; margin-bottom: 16px; }
  .ud-tab-btn { flex: 1; padding: 8px 16px; border-radius: 9px; font-family: 'Epilogue', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.12s; }
  .ud-tab-btn.active { background: #1C1C1A; color: white; border: none; }
  .ud-tab-btn.inactive { background: white; border: 1px solid #E5E2D9; color: #6B6860; }
  .ud-modal-field { margin-bottom: 14px; }
  .ud-modal-label { display: block; font-size: 12px; font-weight: 500; color: #6B6860; margin-bottom: 5px; }
  .ud-modal-input { width: 100%; padding: 11px 14px; border: 1px solid #E5E2D9; border-radius: 11px; font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #111110; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
  .ud-modal-input:focus { border-color: #C9620A; }
  .ud-modal-input-text { font-family: 'Epilogue', sans-serif; font-size: 13px; }
  .ud-modal-error { font-size: 12px; color: #DC2626; margin-top: 6px; }
  .ud-modal-confirm { width: 100%; padding: 14px; background: #1C1C1A; color: white; border: none; border-radius: 12px; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; margin-bottom: 10px; }
  .ud-modal-confirm:disabled { opacity: 0.5; pointer-events: none; }
  .ud-modal-cancel { display: block; text-align: center; font-size: 13px; color: #A8A49C; cursor: pointer; background: none; border: none; padding: 0; width: 100%; }

  /* Referral card */
  .ud-ref-stats { display: flex; gap: 20px; margin-bottom: 16px; }
  .ud-ref-stat { }
  .ud-ref-stat-label { font-size: 11px; font-weight: 600; color: #A8A49C; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .ud-ref-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 500; color: #111110; }
  .ud-ref-list { display: flex; flex-direction: column; gap: 8px; }
  .ud-ref-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #F8F7F4; border-radius: 10px; }
  .ud-ref-name { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 600; font-size: 14px; color: #111110; }
  .ud-ref-uname { font-size: 12px; color: #A8A49C; }
  .ud-ref-right { text-align: right; }
  .ud-ref-date { font-size: 12px; color: #A8A49C; }
  .ud-ref-bonus { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 100px; }

  /* Tabs */
  .ud-tab-nav { display: flex; gap: 4px; border-bottom: 1px solid #E5E2D9; margin-bottom: 20px; }
  .ud-tab-nav-item { padding: 10px 16px; font-size: 14px; font-weight: 500; color: #A8A49C; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s, border-color 0.15s; background: none; border-top: none; border-left: none; border-right: none; font-family: 'Epilogue', sans-serif; }
  .ud-tab-nav-item.active { color: #111110; border-bottom-color: #1C1C1A; }

  .ud-tx-table { width: 100%; border-collapse: collapse; }
  .ud-tx-th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #A8A49C; padding: 8px 12px; text-align: left; border-bottom: 1px solid #E5E2D9; }
  .ud-tx-td { padding: 12px; font-size: 13px; color: #6B6860; border-bottom: 1px solid #F0EEE9; }
  .ud-tx-td:last-child { border-bottom: none; }
  .ud-tx-tr:last-child .ud-tx-td { border-bottom: none; }
  .ud-tx-amount { font-family: 'JetBrains Mono', monospace; font-weight: 500; }
  .ud-tx-credit { color: #16A34A; }
  .ud-tx-debit { color: #DC2626; }

  .ud-placeholder { text-align: center; padding: 40px 20px; color: #A8A49C; font-size: 14px; }

  .ud-spinner { width: 32px; height: 32px; border: 3px solid #E5E2D9; border-top-color: #C9620A; border-radius: 50%; animation: ud-spin 0.8s linear infinite; margin: 60px auto; display: block; }
  @keyframes ud-spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .ud-page { padding: 20px 16px; }
    .ud-wallet-grid { grid-template-columns: 1fr; }
    .ud-profile-actions { flex-direction: row; flex-wrap: wrap; }
    .ud-ref-stats { flex-wrap: wrap; }
  }
`;

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isAdmin = useAdminGuard();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Status confirm
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Wallet adjust modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustTab, setAdjustTab] = useState('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('wallet');
  const [tabData, setTabData] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  const fetchUser = async () => {
    setLoadingUser(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchTab = async (tab) => {
    setTabLoading(true);
    setTabData([]);
    try {
      if (tab === 'wallet') {
        const { data } = await api.get(`/admin/users/${userId}/transactions`);
        setTabData(data.data || []);
      } else if (tab === 'adjustments') {
        const { data } = await api.get(`/admin/users/${userId}/adjustments`);
        setTabData(data || []);
      }
    } catch {
      setTabData([]);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) { fetchUser(); }
  }, [isAdmin, userId]);

  useEffect(() => {
    if (isAdmin && user) fetchTab(activeTab);
  }, [activeTab, isAdmin]);

  const handleStatusToggle = async () => {
    if (!user) return;
    const newStatus = (user.status || 'active') === 'suspended' ? 'active' : 'suspended';
    setToggling(true);
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setUser(prev => ({ ...prev, status: newStatus }));
      setConfirmSuspend(false);
    } catch { /* ignore */ }
    setToggling(false);
  };

  const handleWalletAdjust = async () => {
    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0) { setAdjustError('Enter a valid amount greater than 0.'); return; }
    setAdjusting(true);
    setAdjustError('');
    try {
      const { data } = await api.post(`/admin/users/${userId}/wallet-adjust`, {
        type: adjustTab,
        amount,
        reason: adjustReason.trim() || undefined,
      });
      setUser(prev => ({ ...prev, wallet_balance: data.new_balance }));
      setAdjustOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
      if (activeTab === 'wallet' || activeTab === 'adjustments') fetchTab(activeTab);
    } catch (err) {
      setAdjustError(err.response?.data?.error || 'Adjustment failed.');
    } finally {
      setAdjusting(false);
    }
  };

  if (isAdmin === null || loadingUser) {
    return (
      <>
        <style>{css}</style>
        <div className="ud-page">
          <div className="ud-spinner" />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{css}</style>
        <div className="ud-page">
          <button className="ud-back" onClick={() => navigate('/admin/users')}><ChevronLeft /> Back to All Users</button>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A8A49C' }}>User not found.</div>
        </div>
      </>
    );
  }

  const isActive = (user.status || 'active') === 'active';
  const amtNum = parseFloat(adjustAmount) || 0;

  return (
    <>
      <style>{css}</style>
      <div className="ud-page">
        <button className="ud-back" onClick={() => navigate('/admin/users')}>
          <ChevronLeft /> Back to All Users
        </button>

        {/* Profile header */}
        <div className="ud-card">
          <div className="ud-profile-row">
            <div className="ud-avatar-lg">{getInitials(user.full_name)}</div>

            <div className="ud-profile-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <p className="ud-profile-name">{user.full_name}</p>
                <span className={`ud-pill ${isActive ? 'ud-pill-active' : 'ud-pill-suspended'}`}>
                  {isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              {user.username && <div className="ud-profile-uname">@{user.username}</div>}
              <div className="ud-profile-email">
                {user.email}
                <span className={`ud-pill ${user.email_verified ? 'ud-pill-green' : 'ud-pill-red'}`}>
                  {user.email_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              {user.phone && <div className="ud-profile-phone">{user.phone}</div>}
              {user.referral_code && (
                <div className="ud-profile-ref">
                  <span style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.08em', color: '#A8A49C', marginRight: 4 }}>Ref code:</span>
                  {user.referral_code}
                </div>
              )}
              <div className="ud-profile-joined">Joined {fmtDate(user.created_at)}</div>
            </div>

            <div className="ud-profile-actions">
              {isActive ? (
                <>
                  <button className="ud-action-btn ud-suspend-btn" onClick={() => setConfirmSuspend(v => !v)}>
                    Suspend Account
                  </button>
                  {confirmSuspend && (
                    <div className="ud-confirm-inline">
                      <p>Are you sure you want to suspend this account?</p>
                      <div className="ud-confirm-btns">
                        <button className="ud-confirm-yes" onClick={handleStatusToggle} disabled={toggling}>
                          {toggling ? 'Suspending…' : 'Confirm'}
                        </button>
                        <button className="ud-confirm-no" onClick={() => setConfirmSuspend(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button className="ud-action-btn ud-activate-btn" onClick={handleStatusToggle} disabled={toggling}>
                  {toggling ? 'Activating…' : 'Activate Account'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wallet card */}
        <div className="ud-card">
          <div className="ud-wallet-header">
            <span className="ud-section-title" style={{ margin: 0 }}>Wallet</span>
            <button className="ud-adjust-link" onClick={() => { setAdjustOpen(true); setAdjustError(''); setAdjustAmount(''); setAdjustReason(''); }}>
              Adjust Balance
            </button>
          </div>
          <div className="ud-wallet-grid">
            <div className="ud-wallet-stat">
              <div className="ud-wallet-label">Current Balance</div>
              <div className={`ud-wallet-value ud-wallet-value-lg`}>{fmtMoney(user.wallet_balance)}</div>
            </div>
            <div className="ud-wallet-stat">
              <div className="ud-wallet-label">Total Funded</div>
              <div className={`ud-wallet-value ud-wallet-value-md ud-wallet-value-green`}>{fmtMoney(user.total_funded)}</div>
            </div>
            <div className="ud-wallet-stat">
              <div className="ud-wallet-label">Total Spent</div>
              <div className={`ud-wallet-value ud-wallet-value-md ud-wallet-value-red`}>{fmtMoney(user.total_spent)}</div>
            </div>
          </div>
        </div>

        {/* Referral card */}
        <div className="ud-card">
          <p className="ud-section-title">Referral Activity</p>
          <div className="ud-ref-stats">
            <div className="ud-ref-stat">
              <div className="ud-ref-stat-label">People Referred</div>
              <div className="ud-ref-stat-val">{user.referral_count || 0}</div>
            </div>
            <div className="ud-ref-stat">
              <div className="ud-ref-stat-label">Commission Earned</div>
              <div className="ud-ref-stat-val">₦0.00</div>
            </div>
          </div>
          {(user.referrals || []).length > 0 ? (
            <div className="ud-ref-list">
              {user.referrals.map(r => (
                <div key={r.id} className="ud-ref-row">
                  <div>
                    <div className="ud-ref-name">{r.referee?.full_name || '—'}</div>
                    {r.referee?.username && <div className="ud-ref-uname">@{r.referee.username}</div>}
                  </div>
                  <div className="ud-ref-right">
                    <div className="ud-ref-date">{fmtDate(r.created_at)}</div>
                    <span className={`ud-ref-bonus ud-pill ${r.bonus_paid ? 'ud-pill-green' : 'ud-pill-red'}`}>
                      {r.bonus_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#A8A49C', fontSize: 13 }}>No referrals yet.</div>
          )}
        </div>

        {/* Tab section */}
        <div className="ud-card">
          <div className="ud-tab-nav">
            {['wallet', 'orders', 'adjustments'].map(tab => (
              <button
                key={tab}
                className={`ud-tab-nav-item${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'wallet' ? 'Wallet History' : tab === 'orders' ? 'Orders' : 'Adjustments'}
              </button>
            ))}
          </div>

          {activeTab === 'orders' && (
            <div className="ud-placeholder">Order history will appear here once the orders feature is fully built.</div>
          )}

          {activeTab === 'wallet' && (
            tabLoading ? <div className="ud-spinner" style={{ margin: '20px auto', width: 24, height: 24, borderWidth: 2 }} /> :
            tabData.length === 0 ? <div className="ud-placeholder">No transactions yet.</div> : (
              <table className="ud-tx-table">
                <thead>
                  <tr>
                    <th className="ud-tx-th">Date</th>
                    <th className="ud-tx-th">Description</th>
                    <th className="ud-tx-th">Type</th>
                    <th className="ud-tx-th">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tabData.map(tx => (
                    <tr key={tx.id} className="ud-tx-tr">
                      <td className="ud-tx-td" style={{ whiteSpace: 'nowrap' }}>{fmtDate(tx.created_at)}</td>
                      <td className="ud-tx-td">{tx.description || tx.reference || '—'}</td>
                      <td className="ud-tx-td">
                        <span className={`ud-pill ${tx.type === 'credit' ? 'ud-pill-green' : 'ud-pill-red'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="ud-tx-td">
                        <span className={`ud-tx-amount ${tx.type === 'credit' ? 'ud-tx-credit' : 'ud-tx-debit'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{fmtMoney(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'adjustments' && (
            tabLoading ? <div className="ud-spinner" style={{ margin: '20px auto', width: 24, height: 24, borderWidth: 2 }} /> :
            tabData.length === 0 ? <div className="ud-placeholder">No manual adjustments.</div> : (
              <table className="ud-tx-table">
                <thead>
                  <tr>
                    <th className="ud-tx-th">Date</th>
                    <th className="ud-tx-th">Type</th>
                    <th className="ud-tx-th">Amount</th>
                    <th className="ud-tx-th">Reason</th>
                    <th className="ud-tx-th">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {tabData.map(adj => (
                    <tr key={adj.id} className="ud-tx-tr">
                      <td className="ud-tx-td" style={{ whiteSpace: 'nowrap' }}>{fmtDate(adj.created_at)}</td>
                      <td className="ud-tx-td">
                        <span className={`ud-pill ${adj.type === 'add' ? 'ud-pill-green' : 'ud-pill-red'}`}>
                          {adj.type === 'add' ? 'Add' : 'Deduct'}
                        </span>
                      </td>
                      <td className="ud-tx-td">
                        <span className={`ud-tx-amount ${adj.type === 'add' ? 'ud-tx-credit' : 'ud-tx-debit'}`}>
                          {fmtMoney(adj.amount)}
                        </span>
                      </td>
                      <td className="ud-tx-td">{adj.reason || '—'}</td>
                      <td className="ud-tx-td">{adj.admin?.full_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Wallet Adjust Modal */}
      {adjustOpen && (
        <div className="ud-modal-overlay" onClick={() => setAdjustOpen(false)}>
          <div className="ud-modal" onClick={e => e.stopPropagation()}>
            <p className="ud-modal-title">Adjust Wallet Balance</p>
            <div className="ud-modal-balance">{fmtMoney(user.wallet_balance)}</div>

            <div className="ud-tab-row">
              <button className={`ud-tab-btn ${adjustTab === 'add' ? 'active' : 'inactive'}`} onClick={() => setAdjustTab('add')}>Add Funds</button>
              <button className={`ud-tab-btn ${adjustTab === 'deduct' ? 'active' : 'inactive'}`} onClick={() => setAdjustTab('deduct')}>Deduct Funds</button>
            </div>

            <div className="ud-modal-field">
              <label className="ud-modal-label">Amount (₦)</label>
              <input
                className="ud-modal-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={adjustAmount}
                onChange={e => { setAdjustAmount(e.target.value); setAdjustError(''); }}
              />
            </div>
            <div className="ud-modal-field">
              <label className="ud-modal-label">Reason (for audit log)</label>
              <input
                className="ud-modal-input ud-modal-input-text"
                type="text"
                placeholder="e.g. Manual top-up, refund, penalty"
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
              />
            </div>
            {adjustError && <div className="ud-modal-error">{adjustError}</div>}

            <button
              className="ud-modal-confirm"
              onClick={handleWalletAdjust}
              disabled={adjusting || !adjustAmount || amtNum <= 0}
            >
              {adjusting ? 'Processing…' : `${adjustTab === 'add' ? 'Add' : 'Deduct'} ${amtNum > 0 ? fmtMoney(amtNum) : '₦0.00'}`}
            </button>
            <button className="ud-modal-cancel" onClick={() => setAdjustOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
