import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Copy, CheckCircle, XCircle, Loader, Wallet, AlertCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PLATFORMS = [
  'WhatsApp', 'Telegram', 'Instagram', 'TikTok',
  'Facebook', 'Twitter', 'Gmail', 'Snapchat',
  'Viber', 'Tinder', 'Netflix', 'Uber',
  'Airbnb', 'PayPal', 'Binance', 'Discord',
];

export default function SmsVerification() {
  const [balance, setBalance] = useState(0);
  const [product, setProduct] = useState('');
  const [customProduct, setCustomProduct] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [country, setCountry] = useState('');
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [buying, setBuying] = useState(false);

  const [activeNumber, setActiveNumber] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [smsCode, setSmsCode] = useState('');
  const [polling, setPolling] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const pollRef = useRef(null);

  useEffect(() => {
    api.get('/wallet/balance').then((r) => setBalance(r.data.balance)).catch(() => {});
  }, []);

  const effectiveProduct = showCustom ? customProduct.toLowerCase().trim() : product.toLowerCase();

  useEffect(() => {
    if (!effectiveProduct) { setPrices([]); setCountry(''); return; }
    setLoadingPrices(true);
    setCountry('');
    api.get(`/sms/prices/${encodeURIComponent(effectiveProduct)}`)
      .then((r) => setPrices(Array.isArray(r.data) ? r.data : []))
      .catch(() => { setPrices([]); toast.error(`No prices found for "${effectiveProduct}"`); })
      .finally(() => setLoadingPrices(false));
  }, [effectiveProduct]);

  useEffect(() => {
    if (!activeOrderId || smsCode || orderDone) return;
    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/sms/check/${activeOrderId}`);
        if (res.data.smsCode) {
          setSmsCode(res.data.smsCode);
          setPolling(false);
          clearInterval(pollRef.current);
          toast.success('Code received!');
        }
      } catch (_) {}
    }, 5000);
    return () => { clearInterval(pollRef.current); setPolling(false); };
  }, [activeOrderId, smsCode, orderDone]);

  const selectedCountry = prices.find((p) => p.country === country || p.countryCode === country);
  const cost = selectedCountry ? parseFloat(selectedCountry.price || selectedCountry.cost || 0) : 0;
  const canAfford = cost > 0 && cost <= balance;

  const handleSelectPlatform = (p) => {
    setProduct(p);
    setShowCustom(false);
    setCustomProduct('');
    setCountry('');
  };

  const handleCustomSelect = () => {
    setProduct('');
    setShowCustom(true);
    setCountry('');
    setPrices([]);
  };

  const handleBuyNumber = async () => {
    if (!effectiveProduct) return toast.error('Pick a platform first');
    if (!country) return toast.error('Select a country');
    if (!canAfford) return toast.error('Not enough balance');
    setBuying(true);
    try {
      const res = await api.post('/sms/buy-number', { product: effectiveProduct, country, price: cost });
      setActiveNumber(res.data.number);
      setActiveOrderId(res.data.orderId);
      setSmsCode('');
      setOrderDone(false);
      setBalance((b) => b - cost);
      toast.success('Number ready!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to buy number');
    } finally {
      setBuying(false);
    }
  };

  const handleFinish = async () => {
    clearInterval(pollRef.current);
    try { await api.post(`/sms/finish/${activeOrderId}`); } catch (_) {}
    setOrderDone(true);
    setPolling(false);
    setActiveNumber(null);
    setActiveOrderId(null);
    setSmsCode('');
    toast.success('Done!');
  };

  const handleCancel = async () => {
    clearInterval(pollRef.current);
    try { await api.post(`/sms/cancel/${activeOrderId}`); } catch (_) {}
    setOrderDone(true);
    setPolling(false);
    setActiveNumber(null);
    setActiveOrderId(null);
    setSmsCode('');
    toast('Cancelled');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const activeLabel = showCustom ? (customProduct || 'custom') : (product || '');

  return (
    <div className="dash-page">

      {/* Balance chip */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'var(--gold-dim)', border: '1px solid var(--gold)',
          borderRadius: 10, padding: '7px 12px',
        }}>
          <Wallet size={13} color="var(--gold)" />
          <div>
            <div style={{
              fontSize: 9, fontWeight: 600, color: 'var(--gold)',
              textTransform: 'uppercase', letterSpacing: '1px',
              fontFamily: 'var(--font-body)', lineHeight: 1,
            }}>
              Balance
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--gold2)', lineHeight: 1.2 }}>
              ₦{fmt(balance)}
            </div>
          </div>
        </div>
      </div>

      {/* Active number session */}
      {activeNumber && (
        <div style={{
          background: 'var(--green-dim)', border: '1px solid var(--green)',
          borderRadius: 'var(--radius)', padding: 20, marginBottom: 20,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--green)',
            textTransform: 'uppercase', letterSpacing: '1.2px',
            fontFamily: 'var(--font-body)', marginBottom: 14,
          }}>
            Active Number — {activeLabel}
          </div>

          {/* Phone number display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              flex: 1, fontFamily: 'var(--font-mono)', fontSize: 26,
              fontWeight: 400, color: 'var(--text)', letterSpacing: '0.06em', wordBreak: 'break-all',
            }}>
              {activeNumber}
            </div>
            <button
              onClick={() => handleCopy(activeNumber)}
              title="Copy number"
              style={{
                background: 'var(--green-dim)', border: '1px solid var(--green)',
                borderRadius: 8, color: 'var(--green)', padding: '10px 12px',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Copy size={15} />
            </button>
          </div>

          {/* SMS code or waiting */}
          {smsCode ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: 'var(--green)',
                textTransform: 'uppercase', letterSpacing: '1px',
                fontFamily: 'var(--font-body)', marginBottom: 8,
              }}>
                Verification Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 400, color: 'var(--text)', letterSpacing: '0.12em' }}>
                  {smsCode}
                </div>
                <button
                  onClick={() => handleCopy(smsCode)}
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: 'var(--text2)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              <Loader size={14} color="var(--green)" style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }} />
              Waiting for SMS — checking every 5 seconds
            </div>
          )}

          {/* Finish / Cancel */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleFinish}
              style={{
                flex: 1, padding: '10px 0',
                background: 'var(--green-dim)', border: '1px solid var(--green)',
                borderRadius: 8, color: 'var(--green)',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <CheckCircle size={13} /> Done / Finish
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1, padding: '10px 0',
                background: 'var(--red-dim)', border: '1px solid rgba(240,68,56,0.3)',
                borderRadius: 8, color: 'var(--red)',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <XCircle size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* New number form */}
      {!activeNumber && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 1 — Pick an App */}
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>
              1 — Pick an App
            </span>
            <div className="sms-platform-grid">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`sms-chip${product === p && !showCustom ? ' active' : ''}`}
                  onClick={() => handleSelectPlatform(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className={`sms-chip${showCustom ? ' active' : ''}`}
                onClick={handleCustomSelect}
              >
                Other…
              </button>
            </div>

            {showCustom && (
              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type the app name, e.g. shopify"
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  autoFocus
                  style={{ fontSize: 14 }}
                />
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-body)' }}>
                  Prices load automatically as you type
                </p>
              </div>
            )}
          </div>

          {/* 2 — Country + Get Number (card) */}
          {(product || (showCustom && customProduct.length > 1)) && (
            <div className="card">
              <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>
                2 — Select Country
              </span>

              {loadingPrices ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', color: 'var(--text2)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  Loading available countries…
                </div>
              ) : prices.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text2)', padding: '8px 0', fontFamily: 'var(--font-body)' }}>
                  No numbers available for "{effectiveProduct}" right now.
                </p>
              ) : (
                <select
                  className="form-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{ fontSize: 14, marginBottom: 16 }}
                >
                  <option value="">— Select a country —</option>
                  {prices.map((p, i) => (
                    <option key={i} value={p.country || p.countryCode}>
                      {p.country || p.countryCode} — ₦{p.price || p.cost}
                    </option>
                  ))}
                </select>
              )}

              {cost > 0 && (
                <>
                  {!canAfford && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--red-dim)', border: '1px solid rgba(240,68,56,0.3)',
                      borderRadius: 8, padding: '10px 14px', fontSize: 13,
                      fontFamily: 'var(--font-body)', marginBottom: 12,
                    }}>
                      <AlertCircle size={13} color="var(--red)" />
                      <span style={{ color: 'var(--text2)' }}>
                        Need ₦{fmt(cost - balance)} more.{' '}
                        <Link to="/dashboard/add-funds" style={{ color: 'var(--red)', fontWeight: 600 }}>Add Funds</Link>
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleBuyNumber}
                    disabled={buying || !canAfford}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      opacity: buying || !canAfford ? 0.5 : 1,
                      cursor: buying || !canAfford ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {buying
                      ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Getting number…</>
                      : <><Phone size={14} /> Get Number — ₦{fmt(cost)}</>
                    }
                  </button>
                </>
              )}
            </div>
          )}

          {/* Empty state */}
          {!product && !showCustom && (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <MessageSquare size={24} />
              <h3>Pick an app above</h3>
              <p>Select a platform to see available numbers and prices</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
