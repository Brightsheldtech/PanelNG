import { useEffect, useState, useMemo } from 'react';
import { ShoppingBag, RefreshCw, Search, RotateCcw, Edit2, Check, X } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

function PriceRow({ product, onSave, onReset }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setValue(product.custom_price_ngn != null ? String(product.custom_price_ngn) : String(product.auto_price_ngn));
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    const num = parseFloat(value);
    if (!num || num <= 0) { toast.error('Enter a valid price'); return; }
    setSaving(true);
    try {
      await onSave(product.slug, num, product.title);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => n != null ? Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '—';

  return (
    <tr>
      <td style={{ maxWidth: 280 }}>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{product.title}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{product.slug}</div>
      </td>
      <td>
        {product.platform && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--blue-muted)', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {product.platform}
          </span>
        )}
      </td>
      <td className="td-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        ${Number(product.usd_price || 0).toFixed(2)}
      </td>
      <td className="td-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
        ₦{fmt(product.auto_price_ngn)}
      </td>
      <td>
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              className="form-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step="1"
              min="1"
              style={{ width: 120, padding: '5px 10px', fontSize: 13 }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
            />
            <button className="btn btn-success btn-sm" onClick={save} disabled={saving} style={{ padding: '5px 8px' }}>
              {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Check size={13} />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={cancel} style={{ padding: '5px 8px' }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
              color: product.has_override ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              {product.has_override ? `₦${fmt(product.custom_price_ngn)}` : <span style={{ fontSize: 12, fontStyle: 'italic' }}>auto</span>}
            </span>
            {product.has_override && product.auto_price_ngn > 0 && (
              <span style={{ fontSize: 10, color: 'var(--green)' }}>
                +{(((product.custom_price_ngn - product.auto_price_ngn) / product.auto_price_ngn) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          {!editing && (
            <button className="btn btn-outline btn-sm" onClick={startEdit}>
              <Edit2 size={12} /> {product.has_override ? 'Edit' : 'Set Price'}
            </button>
          )}
          {product.has_override && !editing && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onReset(product.slug)}
              title="Reset to auto price"
              style={{ color: 'var(--text-muted)' }}
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AccszoneManager() {
  const [products, setProducts] = useState([]);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [overrideFilter, setOverrideFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accszone/admin/prices');
      setProducts(res.data.products || []);
      setRate(res.data.rate);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const platforms = useMemo(() => {
    const all = [...new Set(products.map((p) => p.platform).filter(Boolean))].sort();
    return ['All', ...all];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (platformFilter !== 'All') list = list.filter((p) => p.platform === platformFilter);
    if (overrideFilter === 'Custom') list = list.filter((p) => p.has_override);
    if (overrideFilter === 'Auto') list = list.filter((p) => !p.has_override);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    return list;
  }, [products, platformFilter, overrideFilter, search]);

  const customCount = products.filter((p) => p.has_override).length;

  const handleSave = async (slug, price, title) => {
    await api.put(`/accszone/admin/price/${slug}`, { custom_price_ngn: price, title });
    setProducts((prev) => prev.map((p) =>
      p.slug === slug ? { ...p, has_override: true, custom_price_ngn: price } : p
    ));
    toast.success('Price saved');
  };

  const handleReset = async (slug) => {
    try {
      await api.delete(`/accszone/admin/price/${slug}`);
      setProducts((prev) => prev.map((p) =>
        p.slug === slug ? { ...p, has_override: false, custom_price_ngn: null } : p
      ));
      toast.success('Reverted to auto price');
    } catch {
      toast.error('Reset failed');
    }
  };

  return (
    <div className="dash-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Accounts Manager</h1>
          <p className="page-subtitle">
            {products.length} products · {customCount} with custom price
            {rate && <span style={{ color: 'var(--text-muted)' }}> · Rate: ₦{Number(rate).toLocaleString()}/USD</span>}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} />
        </button>
      </div>

      <div style={{ background: 'var(--blue-muted)', border: '1px solid var(--blue)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--blue)', lineHeight: 1.5 }}>
        <strong>Auto price</strong> = ACCSZONE USD price × current exchange rate. Set a <strong>custom price</strong> to override what customers see and pay. Leave as "auto" to always track the rate automatically.
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 30, width: 220 }}
          />
        </div>
        <select className="form-select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} style={{ width: 160 }}>
          {platforms.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="form-select" value={overrideFilter} onChange={(e) => setOverrideFilter(e.target.value)} style={{ width: 140 }}>
          <option value="All">All prices</option>
          <option value="Custom">Custom only</option>
          <option value="Auto">Auto only</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Platform</th>
                  <th>ACCSZONE (USD)</th>
                  <th>Auto (NGN)</th>
                  <th>Your Price (NGN)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <PriceRow
                    key={product.slug}
                    product={product}
                    onSave={handleSave}
                    onReset={handleReset}
                  />
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <ShoppingBag size={28} />
                <h3>No products found</h3>
                <p>{search || platformFilter !== 'All' ? 'Try changing your filters' : 'No products available from ACCSZONE'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
