import { useState, useEffect } from 'react';
import {
  Wallet, ArrowRight, CreditCard, Clock, Building2,
  Copy, CheckCircle, AlertCircle, ArrowLeft,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

function genRef(fullName) {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const prefix = (fullName || 'USR').replace(/\s+/g, '').slice(0, 3).toUpperCase();
  return `PNG-${digits}-${prefix}`;
}

export default function AddFunds() {
  const { user } = useAuth();
  const [tab, setTab] = useState('bank');

  // shared
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // bank transfer state
  const [bankDetails, setBankDetails] = useState([]);
  const [step, setStep] = useState(1);
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  // paystack state
  const [loadingPaystack, setLoadingPaystack] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/wallet/balance'),
      api.get('/wallet/transactions?limit=10'),
      api.get('/bank/details'),
      api.get('/bank/my-requests'),
    ])
      .then(([balRes, txRes, bankRes, reqRes]) => {
        setBalance(balRes.data.balance);
        setTransactions(txRes.data.transactions || []);
        setBankDetails(bankRes.data || []);
        setMyRequests(reqRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const fmtDate = (d) => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleGetDetails = () => {
    const n = parseFloat(amount);
    if (!n || n < 100) return toast.error('Minimum deposit is ₦100');
    if (bankDetails.length === 0) return toast.error('No bank account configured — contact admin');
    const newRef = genRef(user?.full_name);
    setRef(newRef);
    setStep(2);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(ref).then(() => toast.success('Reference copied!'));
  };

  const handleSentPayment = async () => {
    setSubmitting(true);
    try {
      await api.post('/bank/request', { amount: parseFloat(amount), reference: ref });
      setMyRequests((prev) => [{ id: Date.now(), reference: ref, amount: parseFloat(amount), status: 'pending', created_at: new Date().toISOString() }, ...prev]);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setAmount('');
    setRef('');
  };

  const handleChangeAmount = () => {
    setStep(1);
    setRef('');
  };

  const handlePaystack = async (e) => {
    e.preventDefault();
    const naira = parseFloat(amount);
    if (!naira || naira < 100) return toast.error('Minimum is ₦100');
    setLoadingPaystack(true);
    try {
      const res = await api.post('/payment/initialize', { amount: naira });
      window.location.href = res.data.authorization_url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment init failed');
      setLoadingPaystack(false);
    }
  };

  const statusColor = (s) => s === 'confirmed' ? 'var(--green)' : s === 'rejected' ? 'var(--red)' : 'var(--gold)';
  const statusLabel = (s) => s === 'confirmed' ? 'Confirmed' : s === 'rejected' ? 'Rejected' : 'Pending';

  const rowBorder = (i, arr) => i < arr.length - 1 ? '1px solid var(--border)' : 'none';

  return (
    <div className="dash-page">

      {/* Balance card */}
      <div style={{
        background: 'var(--gold-dim2)', border: '1px solid var(--gold)',
        borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: 9, fontWeight: 600, color: 'var(--gold)',
            textTransform: 'uppercase', letterSpacing: '1.2px',
            fontFamily: 'var(--font-body)', marginBottom: 4,
          }}>
            Wallet Balance
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--text)', lineHeight: 1 }}>
            ₦{fmt(balance)}
          </div>
        </div>
        <Wallet size={22} color="var(--gold)" style={{ opacity: 0.7 }} />
      </div>

      {/* Tab toggle pill */}
      <div style={{
        display: 'flex', background: 'var(--surface2)',
        border: '1px solid var(--border)', borderRadius: 10,
        padding: 4, gap: 4, marginBottom: 16,
      }}>
        {[['bank', Building2, 'Bank Transfer'], ['paystack', CreditCard, 'Paystack']].map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setStep(1); setAmount(''); setRef(''); }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '9px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              background: tab === key ? 'var(--gold)' : 'transparent',
              color: tab === key ? '#000' : 'var(--text2)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── BANK TRANSFER ── */}
      {tab === 'bank' && (
        <div className="card" style={{ marginBottom: 16 }}>

          {/* Step 1 — Enter Amount */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--gold)',
                  textTransform: 'uppercase', letterSpacing: '1.2px',
                  fontFamily: 'var(--font-body)', marginBottom: 4,
                }}>
                  Step 1 — Enter Amount
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, fontFamily: 'var(--font-body)' }}>
                  We'll generate a unique reference for your transfer
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 500,
                  color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
                }}>
                  Amount (₦)
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text2)',
                  }}>₦</div>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={100}
                    step={50}
                    style={{ paddingLeft: 30, fontFamily: 'var(--font-mono)', fontSize: 20 }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: 4, display: 'block' }}>
                  Minimum: ₦100
                </span>
              </div>

              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                  textTransform: 'uppercase', letterSpacing: '1px',
                  fontFamily: 'var(--font-body)', marginBottom: 8,
                }}>
                  Quick Amounts
                </div>
                <div className="quick-amounts">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={`quick-amount-btn${parseFloat(amount) === a ? ' selected' : ''}`}
                      onClick={() => setAmount(String(a))}
                    >
                      ₦{a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGetDetails}>
                <Building2 size={14} /> Get Payment Details <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Step 2 — Make the Transfer */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--gold)',
                  textTransform: 'uppercase', letterSpacing: '1.2px',
                  fontFamily: 'var(--font-body)', marginBottom: 4,
                }}>
                  Step 2 — Make the Transfer
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, fontFamily: 'var(--font-body)' }}>
                  Use these exact details when making your transfer
                </p>
              </div>

              {/* Send Exactly box */}
              <div style={{
                background: 'var(--gold-dim2)', border: '1px solid var(--gold)',
                borderRadius: 10, padding: '16px 18px', textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--gold)',
                  textTransform: 'uppercase', letterSpacing: '1.2px',
                  fontFamily: 'var(--font-body)', marginBottom: 6,
                }}>
                  Send Exactly
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: 'var(--text)' }}>
                  ₦{fmt(parseFloat(amount))}
                </div>
              </div>

              {/* Bank accounts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bankDetails.map((b) => (
                  <div key={b.id} style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '14px 16px',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                      fontFamily: 'var(--font-body)', marginBottom: 6,
                    }}>
                      {b.bank_name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 400, color: 'var(--text)', marginBottom: 3, letterSpacing: '0.05em' }}>
                      {b.account_number}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                      {b.account_name}
                    </div>
                  </div>
                ))}
              </div>

              {/* Narration / reference card */}
              <div style={{
                background: 'var(--green-dim)', border: '1px solid var(--green)',
                borderRadius: 10, padding: '14px 16px', position: 'relative',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--green)',
                  textTransform: 'uppercase', letterSpacing: '1px',
                  fontFamily: 'var(--font-body)', marginBottom: 8,
                }}>
                  Use as Transfer Narration / Description
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 400, color: 'var(--green)', letterSpacing: '0.06em' }}>
                    {ref}
                  </span>
                  <button
                    onClick={handleCopyRef}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--green)', padding: 6, flexShrink: 0,
                    }}
                    title="Copy reference"
                  >
                    <Copy size={15} />
                  </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 6, opacity: 0.75, fontFamily: 'var(--font-body)' }}>
                  Put this exact code as your transfer narration — this is how we match your payment
                </div>
              </div>

              {/* Info text */}
              <div style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 14,
                fontSize: 12, color: 'var(--text2)', lineHeight: 1.6,
                fontFamily: 'var(--font-body)',
              }}>
                After sending, click the button below. We'll credit your wallet once we confirm the transfer (usually within minutes during business hours).
              </div>

              <button
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'var(--green)', color: '#000',
                  fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
                  opacity: submitting ? 0.7 : 1,
                }}
                onClick={handleSentPayment}
                disabled={submitting}
              >
                {submitting
                  ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Submitting…</>
                  : <><CheckCircle size={15} /> I Have Made This Transfer</>
                }
              </button>

              <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleChangeAmount}>
                <ArrowLeft size={13} /> Change Amount
              </button>
            </div>
          )}

          {/* Step 3 — Confirmation */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '12px 0', textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--gold-dim)', border: '2px solid var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle size={26} color="var(--gold)" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-brand)', marginBottom: 8 }}>
                  Payment Submitted
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
                  Your request is pending confirmation. We'll credit{' '}
                  <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>₦{fmt(parseFloat(amount))}</strong>
                  {' '}to your wallet once we verify the transfer.
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 13,
                color: 'var(--green)', background: 'var(--green-dim)',
                border: '1px solid var(--green)', borderRadius: 8, padding: '8px 14px',
              }}>
                {ref}
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleReset}>
                Make Another Deposit
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PAYSTACK ── */}
      {tab === 'paystack' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handlePaystack} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 500,
                color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
              }}>
                Amount (₦)
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text2)',
                }}>₦</div>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={100}
                  step={50}
                  style={{ paddingLeft: 30, fontFamily: 'var(--font-mono)', fontSize: 20 }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: 4, display: 'block' }}>
                Minimum: ₦100
              </span>
            </div>

            <div>
              <div style={{
                fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '1px',
                fontFamily: 'var(--font-body)', marginBottom: 8,
              }}>
                Quick Amounts
              </div>
              <div className="quick-amounts">
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`quick-amount-btn${parseFloat(amount) === a ? ' selected' : ''}`}
                    onClick={() => setAmount(String(a))}
                  >
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loadingPaystack}>
              {loadingPaystack
                ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Redirecting…</>
                : <><CreditCard size={14} /> Pay with Paystack <ArrowRight size={13} /></>
              }
            </button>

            <div style={{
              display: 'flex', gap: 6, fontSize: 12, color: 'var(--text3)',
              justifyContent: 'center', alignItems: 'center', fontFamily: 'var(--font-body)',
            }}>
              <CreditCard size={11} />
              Secured by Paystack · Debit &amp; credit cards accepted
            </div>
          </form>
        </div>
      )}

      {/* My pending requests */}
      {myRequests.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>My Deposit Requests</span>
          {myRequests.map((r, i) => (
            <div key={r.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: rowBorder(i, myRequests),
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', letterSpacing: '0.04em' }}>
                  {r.reference}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                  {fmtDate(r.created_at)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}>
                  ₦{fmt(r.amount)}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.6px', color: statusColor(r.status),
                  fontFamily: 'var(--font-body)',
                }}>
                  {statusLabel(r.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>Recent Transactions</span>
        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 28 }}><span className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state" style={{ padding: '28px 0' }}>
            <Wallet size={22} />
            <h3>No transactions yet</h3>
            <p>Your wallet activity will appear here</p>
          </div>
        ) : (
          transactions.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: rowBorder(i, transactions),
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.description}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                  {fmtDate(t.created_at)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 400,
                  color: t.type === 'credit' ? 'var(--green)' : 'var(--red)',
                }}>
                  {t.type === 'credit' ? '+' : '-'}₦{fmt(t.amount)}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
                  letterSpacing: '0.6px', fontFamily: 'var(--font-body)',
                }}>
                  {t.type}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
