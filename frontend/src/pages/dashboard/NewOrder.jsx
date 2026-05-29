import { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, Wallet, AlertCircle, CheckCircle, ArrowRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function NewOrder() {
  const [services, setServices] = useState([]);
  const [balance, setBalance] = useState(0);
  const [platform, setPlatform] = useState('All');
  const [selectedService, setSelectedService] = useState(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/smm/services'), api.get('/wallet/balance')])
      .then(([svcRes, balRes]) => {
        setServices(svcRes.data || []);
        setBalance(balRes.data.balance);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const platforms = useMemo(() => {
    const set = new Set(services.map((s) => s.platform));
    return ['All', ...Array.from(set).sort()];
  }, [services]);

  const filtered = useMemo(
    () => (platform === 'All' ? services : services.filter((s) => s.platform === platform)),
    [services, platform]
  );

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return filtered;
    const q = search.toLowerCase();
    return filtered.filter((s) => s.name.toLowerCase().includes(q));
  }, [filtered, search]);

  const grouped = useMemo(() => {
    const map = {};
    searchFiltered.forEach((s) => {
      if (!map[s.platform]) map[s.platform] = [];
      map[s.platform].push(s);
    });
    return map;
  }, [searchFiltered]);

  const qty = parseInt(quantity) || 0;
  const cost = selectedService && qty > 0
    ? parseFloat(((selectedService.sell_price * qty) / 1000).toFixed(2))
    : 0;
  const canAfford = balance >= cost && cost > 0;

  const handleServiceChange = (e) => {
    const svc = services.find((s) => s.id === e.target.value);
    setSelectedService(svc || null);
    setQuantity(svc ? String(svc.min_quantity) : '');
  };

  const handlePlatformChange = (p) => {
    setPlatform(p);
    setSelectedService(null);
    setQuantity('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) return toast.error('Select a service first');
    if (!link.trim()) return toast.error('Enter the target link or username');
    if (qty < selectedService.min_quantity || qty > selectedService.max_quantity) {
      return toast.error(`Quantity must be between ${selectedService.min_quantity.toLocaleString()} and ${selectedService.max_quantity.toLocaleString()}`);
    }
    if (!canAfford) return toast.error('Not enough wallet balance');
    setSubmitting(true);
    try {
      const res = await api.post('/smm/order', { service_id: selectedService.id, link, quantity: qty });
      setSuccess(res.data.order);
      setBalance((b) => b - cost);
      setLink('');
      setQuantity(String(selectedService.min_quantity));
      toast.success('Order placed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <span className="spinner" />
      </div>
    );
  }

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

      {/* Success banner */}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--green-dim)', border: '1px solid var(--green)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          fontSize: 13, fontFamily: 'var(--font-body)',
        }}>
          <CheckCircle size={15} color="var(--green)" style={{ flexShrink: 0 }} />
          <span style={{ color: 'var(--text2)' }}>
            Order placed —{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)' }}>
              #{success.id.slice(0, 8)}
            </span>.{' '}
            <Link to="/dashboard/orders" style={{ color: 'var(--green)', fontWeight: 600 }}>
              Track it in Order History
            </Link>
          </span>
        </div>
      )}

      {/* Platform filter chips — horizontal scroll */}
      <div className="platform-scroll" style={{ marginBottom: 16 }}>
        {platforms.map((p) => (
          <button
            key={p}
            type="button"
            className={`platform-chip${platform === p ? ' active' : ''}`}
            onClick={() => handlePlatformChange(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text3)', pointerEvents: 'none',
        }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search services… e.g. followers, likes, views"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 34, paddingRight: search ? 34 : 12, fontSize: 13 }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', display: 'flex', alignItems: 'center', padding: 2,
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Form card */}
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Service dropdown */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
            }}>
              Service
            </label>
            <select
              className="form-select"
              value={selectedService?.id || ''}
              onChange={handleServiceChange}
              required
              style={{ fontSize: 14 }}
            >
              <option value="">— Choose a service —</option>
              {platform === 'All'
                ? Object.entries(grouped).map(([plat, svcs]) => (
                  <optgroup key={plat} label={plat}>
                    {svcs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — ₦{fmt(s.sell_price)}/1k
                      </option>
                    ))}
                  </optgroup>
                ))
                : searchFiltered.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₦{fmt(s.sell_price)}/1k
                  </option>
                ))
              }
            </select>
            {search && (
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5, fontFamily: 'var(--font-body)' }}>
                {searchFiltered.length} result{searchFiltered.length !== 1 ? 's' : ''} for "{search}"
              </p>
            )}
            {searchFiltered.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
                {search
                  ? `No services match "${search}" — try a different keyword.`
                  : `No services for ${platform} yet — try "All" or another platform.`}
              </p>
            )}
          </div>

          {/* Service detail strip */}
          {selectedService && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1, background: 'var(--border)', borderRadius: 10, overflow: 'hidden',
            }}>
              {[
                { label: 'Rate', value: `₦${fmt(selectedService.sell_price)}/1k` },
                { label: 'Min', value: selectedService.min_quantity.toLocaleString() },
                { label: 'Max', value: selectedService.max_quantity.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--surface2)', padding: '10px 12px' }}>
                  <div style={{
                    fontSize: 9, fontWeight: 600, color: 'var(--text3)',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                    fontFamily: 'var(--font-body)', marginBottom: 4,
                  }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 400, color: 'var(--text)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Link */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
            }}>
              Target Link or Username
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="https://instagram.com/yourpage"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              style={{ fontSize: 14 }}
            />
          </div>

          {/* Quantity */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
            }}>
              Quantity
              {selectedService && (
                <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                  ({selectedService.min_quantity.toLocaleString()} – {selectedService.max_quantity.toLocaleString()})
                </span>
              )}
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 1000"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={selectedService?.min_quantity}
              max={selectedService?.max_quantity}
              required
              style={{ fontSize: 14 }}
            />
          </div>

          {/* Cost line */}
          {cost > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 14px', gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>
                {qty.toLocaleString()} × ₦{fmt(selectedService?.sell_price)}/1k
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-body)', marginRight: 5 }}>Total</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 400,
                    color: canAfford ? 'var(--gold)' : 'var(--red)',
                  }}>
                    ₦{fmt(cost)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-body)', marginRight: 5 }}>After</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 400,
                    color: canAfford ? 'var(--green)' : 'var(--red)',
                  }}>
                    ₦{fmt(balance - cost)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Insufficient balance */}
          {!canAfford && cost > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--red-dim)', border: '1px solid rgba(240,68,56,0.3)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, fontFamily: 'var(--font-body)',
            }}>
              <AlertCircle size={14} color="var(--red)" style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--text2)' }}>
                You need ₦{fmt(cost - balance)} more.{' '}
                <Link to="/dashboard/add-funds" style={{ color: 'var(--red)', fontWeight: 600 }}>
                  Add Funds <ArrowRight size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </Link>
              </span>
            </div>
          )}

          {/* Place Order button */}
          <button
            type="submit"
            disabled={submitting || !canAfford || !selectedService || !link || qty === 0}
            className="btn btn-primary"
            style={{
              width: '100%',
              opacity: submitting || !canAfford || !selectedService ? 0.5 : 1,
              cursor: submitting || !canAfford || !selectedService ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting
              ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Placing order…</>
              : <><ShoppingCart size={15} /> {cost > 0 ? `Place Order — ₦${fmt(cost)}` : 'Place Order'}</>
            }
          </button>

        </form>
      </div>
    </div>
  );
}
