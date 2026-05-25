import { useState, useEffect } from 'react';
import { MessageSquare, Eye, EyeOff, RefreshCw, RotateCcw, Save, Search, ChevronLeft } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// Name resolution — backend returns .name on each service from CODE_TO_NAME map
// This fallback is only used locally if needed
function displayName(code) {
  return code ? code.toUpperCase() : '';
}

// ── Country row component ──────────────────────────────────────
function CountryRow({ country, serviceCode, onUpdated, rate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ custom_price: country.custom_price ?? '', sort_order: country.sort_order ?? 999 });
  const [saving, setSaving] = useState(false);

  const save = async (patch) => {
    setSaving(true);
    try {
      const res = await api.put('/admin/sms-country-settings', {
        service_code: serviceCode,
        country_id: country.countryId,
        country_name: country.country,
        is_hidden: country.is_hidden,
        sort_order: form.sort_order,
        custom_price: form.custom_price === '' ? null : form.custom_price,
        ...patch,
      });
      onUpdated(country.countryId, { setting_id: res.data.id, ...res.data });
      setEditing(false);
      toast.success('Saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const toggleHide = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/sms-country-settings', {
        service_code: serviceCode, country_id: country.countryId, country_name: country.country,
        is_hidden: !country.is_hidden, sort_order: country.sort_order ?? 999,
        custom_price: country.custom_price ?? null,
      });
      onUpdated(country.countryId, { setting_id: res.data.id, is_hidden: res.data.is_hidden });
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!country.setting_id || !window.confirm(`Reset ${country.country} to defaults?`)) return;
    setSaving(true);
    try {
      await api.delete(`/admin/sms-country-settings/${country.setting_id}`);
      onUpdated(country.countryId, { setting_id: null, is_hidden: false, sort_order: 999, custom_price: null });
      setForm({ custom_price: '', sort_order: 999 });
      toast.success('Reset');
    } catch { toast.error('Reset failed'); }
    finally { setSaving(false); }
  };

  const toNgn = (usd) => Number(usd || 0) * Number(rate || 2900);
  const fmtNgn = (n) => toNgn(n).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const fmtUsd = (n) => Number(n || 0).toFixed(4);
  const hasCustom = !!country.setting_id;
  const costNgn = toNgn(country.cost);
  const margin = country.custom_price != null && costNgn > 0
    ? (((Number(country.custom_price) - costNgn) / costNgn) * 100).toFixed(0)
    : null;

  return (
    <tr style={{ opacity: country.is_hidden ? 0.4 : 1 }}>
      <td style={{ fontSize: 13, fontWeight: 600 }}>
        {country.country}
        {hasCustom && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--primary-muted)', color: 'var(--primary)', border: '1px solid var(--primary-border)', borderRadius: 4, padding: '1px 5px' }}>custom</span>}
      </td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{country.count?.toLocaleString()}</td>
      <td>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>₦{fmtNgn(country.cost)}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>${fmtUsd(country.cost)}</div>
      </td>
      <td>
        {editing ? (
          <input type="number" className="form-input" value={form.custom_price}
            onChange={(e) => setForm({ ...form, custom_price: e.target.value })}
            placeholder={costNgn.toFixed(2)} style={{ width: 120, padding: '4px 8px', fontSize: 13 }} step="0.01" />
        ) : (
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: country.custom_price != null ? 'var(--primary)' : 'var(--text-muted)' }}>
              ₦{country.custom_price != null ? Number(country.custom_price).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : fmtNgn(country.cost)}
            </span>
            {margin !== null && (
              <span style={{ fontSize: 10, color: Number(margin) >= 0 ? 'var(--green)' : 'var(--red)', marginLeft: 4 }}>
                {Number(margin) >= 0 ? '+' : ''}{margin}%
              </span>
            )}
            {country.custom_price == null && (
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>not set</div>
            )}
          </div>
        )}
      </td>
      <td>
        {editing ? (
          <input type="number" className="form-input" value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            style={{ width: 70, padding: '4px 8px', fontSize: 13 }} min={1} />
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>{country.sort_order ?? 999}</span>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          {editing ? (
            <>
              <button className="btn btn-success btn-sm" onClick={() => save({})} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <><Save size={11} /> Save</>}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => { setForm({ custom_price: country.custom_price ?? '', sort_order: country.sort_order ?? 999 }); setEditing(true); }} disabled={saving}>Edit</button>
              <button onClick={toggleHide} disabled={saving} title={country.is_hidden ? 'Show' : 'Hide'}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: country.is_hidden ? 'var(--text-dim)' : 'var(--green)', display: 'flex', alignItems: 'center' }}>
                {country.is_hidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              {hasCustom && (
                <button onClick={reset} disabled={saving} title="Reset to defaults"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                  <RotateCcw size={13} />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Country detail view ────────────────────────────────────────
function CountryView({ serviceCode, serviceName, onBack, rate }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/sms-prices/${encodeURIComponent(serviceCode)}`)
      .then((r) => setCountries(r.data.countries || []))
      .catch(() => toast.error('Failed to load countries'))
      .finally(() => setLoading(false));
  }, [serviceCode]);

  const handleUpdated = (countryId, patch) =>
    setCountries((prev) => prev.map((c) => c.countryId === countryId ? { ...c, ...patch } : c));

  const visible = showHidden ? countries : countries.filter((c) => !c.is_hidden);
  const hiddenCount = countries.filter((c) => c.is_hidden).length;
  const customCount = countries.filter((c) => c.setting_id).length;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>
          <ChevronLeft size={14} /> All Services
        </button>
        <div>
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{serviceName}</span>
          <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{serviceCode}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {countries.length} countries
          {hiddenCount > 0 && <span style={{ marginLeft: 8, color: 'var(--red)' }}>{hiddenCount} hidden</span>}
          {customCount > 0 && <span style={{ marginLeft: 8, color: 'var(--primary)' }}>{customCount} customized</span>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>₦{Number(rate || 2900).toLocaleString()}/$1</span>
          <button className="btn btn-outline btn-sm" onClick={() => setShowHidden((v) => !v)}>
            {showHidden ? <EyeOff size={12} /> : <Eye size={12} />}
            {showHidden ? 'Hide hidden' : 'Show all'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Available</th>
                  <th>HeroSMS Cost</th>
                  <th>Your Sell Price (₦)</th>
                  <th>Sort</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <CountryRow key={c.countryId} country={c} serviceCode={serviceCode} onUpdated={handleUpdated} rate={rate} />
                ))}
              </tbody>
            </table>
            {visible.length === 0 && (
              <div className="empty-state">
                <MessageSquare size={24} />
                <h3>No countries</h3>
                <p>HeroSMS has no numbers for this service right now</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main service list ──────────────────────────────────────────
export default function SmsManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // { code, name }
  const [rate, setRate] = useState(2900);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/sms-all-services'),
      api.get('/admin/settings'),
    ])
      .then(([svcRes, settingsRes]) => {
        setServices(svcRes.data || []);
        const r = parseFloat(settingsRes.data?.usd_ngn_rate);
        if (r > 0) setRate(r);
      })
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    return s.code.includes(q) || (s.name || '').toLowerCase().includes(q);
  });

  const toNgn = (usd) => Number(usd || 0) * rate;
  const fmt = (n) => toNgn(n).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  if (selected) {
    return (
      <div className="dash-page">
        <CountryView serviceCode={selected.code} serviceName={selected.name} onBack={() => setSelected(null)} rate={rate} />
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">SMS Manager</h1>
          <p className="page-subtitle">{services.length} services available on HeroSMS · prices at ₦{rate.toLocaleString()}/$1</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
        <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 32 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><span className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Code</th>
                  <th>Total Numbers</th>
                  <th>Countries</th>
                  <th>Wholesale Price (HeroSMS)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.code} style={{ cursor: 'pointer' }} onClick={() => setSelected({ code: s.code, name: s.name || displayName(s.code) })}>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name || displayName(s.code)}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-muted)' }}>
                        {s.code}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                      {s.totalCount?.toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                      {s.countryCount}
                    </td>
                    <td>
                      {s.minCost === s.maxCost ? (
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>₦{fmt(s.minCost)}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>${Number(s.minCost || 0).toFixed(4)}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>₦{fmt(s.minCost)} – ₦{fmt(s.maxCost)}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>${Number(s.minCost || 0).toFixed(4)} – ${Number(s.maxCost || 0).toFixed(4)}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setSelected({ code: s.code, name: s.name || displayName(s.code) }); }}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="empty-state">
                <MessageSquare size={28} />
                <h3>No services found</h3>
                <p>{search ? `No match for "${search}"` : 'HeroSMS returned no services'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
