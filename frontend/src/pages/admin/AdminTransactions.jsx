import { useEffect, useState } from 'react';
import {
  RefreshCw, TrendingUp, TrendingDown, Gift, BarChart2,
  AlertCircle, CreditCard, Landmark, Smartphone, ShoppingCart,
  MessageSquare, Package, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../../lib/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function detectCategory(tx) {
  const desc = (tx.description || '').toLowerCase();
  const ref  = (tx.reference  || '').toUpperCase();
  if (desc.includes('via card') || desc.includes('via virtual account') || desc.includes('bank deposit confirmed') || desc.includes('admin top-up')) return 'deposit';
  if (ref.startsWith('SMM-') || ref.startsWith('SMS-') || ref.startsWith('ACCS-')) return 'service';
  if (desc.includes('welcome bonus') || desc.includes('referral reward')) return 'bonus';
  if (desc.includes('refund') || desc.includes('admin deduction')) return 'adjustment';
  return 'other';
}

function SummaryCard({ loading, label, value, sub, accent, icon }) {
  return (
    <div style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 12, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: accent }}>
        {icon}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
        {loading ? '—' : `₦${value}`}
      </div>
      {!loading && sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>{icon} {title}</div>
        {open ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
      </button>
      {open && <div style={{ padding: '0 20px 16px' }}>{children}</div>}
    </div>
  );
}

function Row({ label, icon, value, count, color, total }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: total ? '10px 0 0' : '6px 0',
      borderTop: total ? '1px solid var(--border)' : 'none',
      marginTop: total ? 8 : 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: total ? 'var(--text)' : 'var(--text-muted)', fontWeight: total ? 700 : 400 }}>
        {icon && <span style={{ color: 'var(--text-dim)' }}>{icon}</span>}
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {count != null && (
          <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-mono)' }}>{count}</span>
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: total ? 700 : 500, color: color || 'var(--text)' }}>
          ₦{value}
        </span>
      </div>
    </div>
  );
}

function CategoryPill({ cat }) {
  const map = {
    deposit:    { label: 'Deposit',    bg: 'rgba(16,185,129,0.12)', color: 'var(--green)' },
    service:    { label: 'Service',    bg: 'rgba(239,68,68,0.12)',  color: 'var(--red)'   },
    bonus:      { label: 'Bonus',      bg: 'rgba(245,166,35,0.12)', color: '#F5A623'       },
    adjustment: { label: 'Adjustment', bg: 'rgba(99,102,241,0.12)', color: '#6366F1'       },
    other:      { label: 'Other',      bg: 'var(--border)',          color: 'var(--text-muted)' },
  };
  const m = map[cat] || map.other;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: m.bg, color: m.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {m.label}
    </span>
  );
}

const LIMIT = 50;

export default function AdminTransactions() {
  const [summary, setSummary]         = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(0);
  const [category, setCategory]       = useState('all');

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get('/admin/finance-summary');
      setSummary(res.data);
    } catch (err) {
      console.error('finance-summary error:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadTx = async (reset = true, cat = category) => {
    setLoading(true);
    const offset = reset ? 0 : page * LIMIT;
    try {
      const params = { limit: LIMIT, offset };
      if (cat !== 'all') params.category = cat;
      const res = await api.get('/admin/transactions', { params });
      const rows = res.data.transactions || [];
      setTransactions(reset ? rows : (prev) => [...prev, ...rows]);
      setTotal(res.data.total || 0);
      if (reset) setPage(0);
    } catch (err) {
      console.error('transactions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSummary(); loadTx(true); }, []);

  const switchCategory = (cat) => {
    setCategory(cat);
    loadTx(true, cat);
  };

  const refresh = () => { loadSummary(); loadTx(true, category); };

  const s = summary;

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Finance Overview</h1>
          <p className="page-subtitle">Platform-wide financial tracking</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={refresh} disabled={summaryLoading || loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <SummaryCard
          loading={summaryLoading}
          label="Total Money In"
          value={fmt(s?.deposits?.total)}
          sub={`${(s?.deposits?.card?.count || 0) + (s?.deposits?.virtual_account?.count || 0) + (s?.deposits?.bank?.count || 0) + (s?.deposits?.admin_topup?.count || 0)} deposits`}
          accent="var(--green)"
          icon={<TrendingUp size={17} />}
        />
        <SummaryCard
          loading={summaryLoading}
          label="Service Revenue"
          value={fmt(s?.service_revenue?.total)}
          sub={`${(s?.service_revenue?.smm?.count || 0) + (s?.service_revenue?.sms?.count || 0) + (s?.service_revenue?.accounts?.count || 0)} orders`}
          accent="var(--red)"
          icon={<TrendingDown size={17} />}
        />
        <SummaryCard
          loading={summaryLoading}
          label="Bonuses Given"
          value={fmt(s?.bonuses?.total)}
          sub={`${s?.bonuses?.welcome?.count || 0} welcome · ${s?.bonuses?.referrer_rewards?.count || 0} referral`}
          accent="#F5A623"
          icon={<Gift size={17} />}
        />
        <SummaryCard
          loading={summaryLoading}
          label="SMM Margin"
          value={fmt(s?.margin?.smm_margin)}
          sub={s?.margin?.note || `${s?.margin?.orders_with_cost_data || 0}/${s?.margin?.total_orders || 0} orders tracked`}
          accent={!s || s.margin?.smm_margin >= 0 ? 'var(--green)' : 'var(--red)'}
          icon={<BarChart2 size={17} />}
        />
      </div>

      {/* ── Breakdowns ── */}
      {!summaryLoading && s && (
        <>
          {/* Deposits */}
          <Section title="Deposits" icon={<Landmark size={14} />}>
            <Row label="Card Payment"    icon={<CreditCard size={12}  />} value={fmt(s.deposits.card.total)}            count={s.deposits.card.count}            color="var(--green)" />
            <Row label="Virtual Account" icon={<Smartphone size={12}  />} value={fmt(s.deposits.virtual_account.total)} count={s.deposits.virtual_account.count} color="var(--green)" />
            <Row label="Bank Transfer"   icon={<Landmark size={12}    />} value={fmt(s.deposits.bank.total)}            count={s.deposits.bank.count}            color="var(--green)" />
            <Row label="Admin Top-up"    icon={<TrendingUp size={12}  />} value={fmt(s.deposits.admin_topup.total)}     count={s.deposits.admin_topup.count}     color="var(--green)" />
            <Row label="Total In" value={fmt(s.deposits.total)} color="var(--green)" total />
          </Section>

          {/* Service Revenue */}
          <Section title="Service Revenue (charged to users)" icon={<ShoppingCart size={14} />}>
            <Row label="SMM Orders"       icon={<TrendingDown size={12} />} value={fmt(s.service_revenue.smm.total)}      count={s.service_revenue.smm.count}      color="var(--red)" />
            <Row label="SMS Verification" icon={<MessageSquare size={12}/>} value={fmt(s.service_revenue.sms.total)}      count={s.service_revenue.sms.count}      color="var(--red)" />
            <Row label="Buy Accounts"     icon={<Package size={12}     />} value={fmt(s.service_revenue.accounts.total)} count={s.service_revenue.accounts.count} color="var(--red)" />
            <Row label="Total Revenue" value={fmt(s.service_revenue.total)} color="var(--red)" total />
          </Section>

          {/* Bonuses */}
          <Section title="Bonuses Given Out" icon={<Gift size={14} />}>
            <Row label="Welcome Bonuses (₦200 each)"  value={fmt(s.bonuses.welcome.total)}          count={s.bonuses.welcome.count}          color="#F5A623" />
            <Row label="Referrer Rewards (₦500 each)" value={fmt(s.bonuses.referrer_rewards.total)} count={s.bonuses.referrer_rewards.count} color="#F5A623" />
            <Row label="Total Bonuses" value={fmt(s.bonuses.total)} color="#F5A623" total />
          </Section>

          {/* Margin */}
          <Section title="SMM Margin (Revenue vs API Cost)" icon={<BarChart2 size={14} />}>
            <Row label="User Revenue (sell price)"  value={fmt(s.margin.smm_revenue)}  color="var(--green)" />
            <Row label="API Cost Paid to JAP"       value={fmt(s.margin.smm_api_cost)} color="var(--red)"   />
            <Row label="Net Margin" value={fmt(s.margin.smm_margin)} color={s.margin.smm_margin >= 0 ? 'var(--green)' : 'var(--red)'} total />
            {s.margin.note && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <AlertCircle size={11} /> {s.margin.note}. API cost is captured on new orders only.
              </div>
            )}
          </Section>

          {/* Refunds + Deductions */}
          {(s.refunds.count > 0 || s.admin_deductions.count > 0 || s.rejected_deposits.count > 0) && (
            <Section title="Adjustments & Rejected Deposits" icon={<AlertCircle size={14} />} defaultOpen={false}>
              {s.refunds.count > 0 && (
                <Row label="Refunds issued" value={fmt(s.refunds.total)} count={s.refunds.count} color="var(--green)" />
              )}
              {s.admin_deductions.count > 0 && (
                <Row label="Admin deductions" value={fmt(s.admin_deductions.total)} count={s.admin_deductions.count} color="var(--red)" />
              )}
              {s.rejected_deposits.count > 0 && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.07)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={13} color="var(--red)" />
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>
                    <strong>₦{fmt(s.rejected_deposits.total)}</strong> in bank transfer requests rejected
                    <span style={{ color: 'var(--text-muted)' }}> ({s.rejected_deposits.count} requests)</span>
                  </span>
                </div>
              )}
            </Section>
          )}
        </>
      )}

      {/* ── Transaction Log ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Transaction Log</div>
        <div style={{ display: 'flex', gap: 5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
          {[
            ['all',            'All'],
            ['deposits',       'Deposits'],
            ['service_debits', 'Service Debits'],
            ['bonuses',        'Bonuses'],
            ['adjustments',    'Adjustments'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => switchCategory(val)}
              style={{
                padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: category === val ? 'var(--primary)' : 'transparent',
                color: category === val ? '#000' : 'var(--text-muted)',
                fontSize: 12, fontWeight: category === val ? 700 : 500, whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        {total.toLocaleString()} transaction{total !== 1 ? 's' : ''}
        {category !== 'all' && ` matching "${category.replace('_', ' ')}"`}
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
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="td-mono td-muted" style={{ fontSize: 11 }}>{t.reference}</td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.users?.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.users?.email}</div>
                    </td>
                    <td><CategoryPill cat={detectCategory(t)} /></td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: t.type === 'credit' ? 'var(--green-muted)' : 'var(--red-muted)',
                        color: t.type === 'credit' ? 'var(--green)' : 'var(--red)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
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
            {transactions.length === 0 && !loading && (
              <div className="empty-state">
                <BarChart2 size={28} />
                <h3>No transactions</h3>
                <p>No {category !== 'all' ? category.replace('_', ' ') : ''} transactions found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {transactions.length < total && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            className="btn btn-outline"
            onClick={() => { setPage((p) => p + 1); loadTx(false); }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
