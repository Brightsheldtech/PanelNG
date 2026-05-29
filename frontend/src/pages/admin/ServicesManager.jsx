import { useEffect, useState, useMemo, useRef } from 'react';
import { RefreshCw, ToggleLeft, ToggleRight, Plus, Download, Search, X, Percent, DollarSign, MessageSquare, Zap } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
const PAGE_SIZE = 100;

// ─── Add Service Modal (SMM) ─────────────────────────────────────────────────
function AddServiceModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ platform: '', name: '', panel_service_id: '', cost_price: '', sell_price: '', min_quantity: 100, max_quantity: 10000, provider: 'jap' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/services', form);
      onAdded(res.data);
      toast.success('Service added');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add service');
    } finally { setSaving(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }}>
        <h3 style={{ fontFamily: 'var(--font-brand)', marginBottom: 20 }}>Add New Service</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Platform</label>
              <input className="form-input" placeholder="Instagram" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Provider</label>
              <select className="form-select" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                <option value="jap">JAP</option>
                <option value="smmraja">SMMRaja</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Service Name</label>
            <input className="form-input" placeholder="Instagram Followers" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Panel Service ID</label>
              <input className="form-input" placeholder="123" value={form.panel_service_id} onChange={(e) => setForm({ ...form, panel_service_id: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Cost Price (USD/1k)</label>
              <input type="number" className="form-input" placeholder="0.00" step="0.0001" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Sell Price (USD/1k)</label>
              <input type="number" className="form-input" placeholder="0.00" step="0.0001" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Min Qty</label>
              <input type="number" className="form-input" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Qty</label>
              <input type="number" className="form-input" value={form.max_quantity} onChange={(e) => setForm({ ...form, max_quantity: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── SMM Tab ─────────────────────────────────────────────────────────────────
function SmmTab() {
  const [services, setServices] = useState([]);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({ jap: false, smmraja: false });
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [providerFilter, setProviderFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [manualInputs, setManualInputs] = useState({});
  const [saving, setSaving] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [svcRes, rateRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/settings/exchange-rate'),
      ]);
      setServices(svcRes.data || []);
      setRate(Number(rateRes.data.value || 2900));
    } catch { toast.error('Failed to load services'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const platforms = useMemo(() => ['All', ...Array.from(new Set(services.map((s) => s.platform))).sort()], [services]);

  const filtered = useMemo(() => {
    let list = services;
    if (providerFilter !== 'all') list = list.filter((s) => s.provider === providerFilter);
    if (platformFilter !== 'All') list = list.filter((s) => s.platform === platformFilter);
    if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.platform.toLowerCase().includes(search.toLowerCase()) || s.panel_service_id?.includes(search));
    return list;
  }, [services, platformFilter, providerFilter, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => { setPage(0); setSelectedIds(new Set()); }, [search, platformFilter, providerFilter]);

  const handleToggle = async (svc) => {
    try {
      const res = await api.patch('/admin/services', { id: svc.id, is_active: !svc.is_active });
      setServices((prev) => prev.map((s) => (s.id === svc.id ? res.data : s)));
      toast.success(svc.is_active ? 'Disabled' : 'Enabled');
    } catch { toast.error('Toggle failed'); }
  };

  const saveManualPrice = async (svc, value) => {
    setSaving((p) => ({ ...p, [svc.id]: true }));
    try {
      const res = await api.patch('/admin/services', { id: svc.id, manual_price: value });
      setServices((prev) => prev.map((s) => (s.id === svc.id ? res.data : s)));
      if (value === null) {
        setManualInputs((p) => { const n = { ...p }; delete n[svc.id]; return n; });
        toast.success('Override cleared');
      } else {
        toast.success('Price saved');
      }
    } catch { toast.error('Save failed'); }
    finally { setSaving((p) => ({ ...p, [svc.id]: false })); }
  };

  const handleSync = async (provider) => {
    setSyncing((s) => ({ ...s, [provider]: true }));
    try {
      const res = await api.post('/admin/sync-services', { provider });
      toast.success(`Synced ${res.data.synced} of ${res.data.total} services from ${provider === 'smmraja' ? 'SMMRaja' : 'JAP'}`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Sync failed'); }
    finally { setSyncing((s) => ({ ...s, [provider]: false })); }
  };

  const toggleSelectPage = (checked) => {
    const ids = new Set(selectedIds);
    pageItems.forEach((s) => { if (checked) ids.add(s.id); else ids.delete(s.id); });
    setSelectedIds(ids);
  };

  const applyBulk = async () => {
    const pct = parseFloat(bulkPercent);
    if (isNaN(pct)) return toast.error('Enter a valid percentage');
    setBulkApplying(true);
    try {
      const res = await api.post('/admin/services/bulk-price', { ids: [...selectedIds], percent: pct });
      toast.success(`Updated ${res.data.updated} services`);
      setSelectedIds(new Set());
      setBulkPercent('');
      load();
    } catch { toast.error('Bulk update failed'); }
    finally { setBulkApplying(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" /></div>;

  return (
    <div>
      {showAdd && <AddServiceModal onClose={() => setShowAdd(false)} onAdded={(s) => setServices((prev) => [s, ...prev])} />}

      {/* Header actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13} /></button>
        <button className="btn btn-outline btn-sm" onClick={() => handleSync('jap')} disabled={syncing.jap || syncing.smmraja}>
          {syncing.jap ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Download size={13} />}
          {syncing.jap ? 'Syncing…' : 'Sync JAP'}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => handleSync('smmraja')} disabled={syncing.jap || syncing.smmraja}>
          {syncing.smmraja ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Download size={13} />}
          {syncing.smmraja ? 'Syncing…' : 'Sync SMMRaja'}
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add</button>
      </div>

      {/* Info row */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        {services.length} services · {services.filter((s) => s.is_active).length} active
        {rate && <span style={{ marginLeft: 12, color: 'var(--primary)', fontWeight: 600 }}>Rate: ₦{rate.toLocaleString()}/$1</span>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search name, platform, ID…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
        <select className="form-select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} style={{ width: 150 }}>
          {platforms.map((p) => <option key={p}>{p}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'jap', 'smmraja'].map((p) => (
            <button key={p} onClick={() => setProviderFilter(p)}
              className={`btn btn-sm ${providerFilter === p ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '4px 10px', fontSize: 12 }}>
              {p === 'all' ? 'All' : p === 'jap' ? 'JAP' : 'SMMRaja'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{ background: 'var(--primary-muted)', border: '1px solid var(--primary-border, var(--border))', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedIds.size} selected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Percent size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="number"
                placeholder="e.g. -10 or +20"
                value={bulkPercent}
                onChange={(e) => setBulkPercent(e.target.value)}
                style={{ width: 130, height: 32, padding: '0 28px 0 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--text)', outline: 'none' }}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={applyBulk} disabled={bulkApplying}>
              {bulkApplying ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Apply %'}
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())} style={{ marginLeft: 'auto' }}>
            <X size={13} /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox"
                    checked={pageItems.length > 0 && pageItems.every((s) => selectedIds.has(s.id))}
                    onChange={(e) => toggleSelectPage(e.target.checked)}
                  />
                </th>
                <th>Platform</th>
                <th>Service Name</th>
                <th>Provider</th>
                <th>Auto NGN/1k</th>
                <th style={{ minWidth: 160 }}>Manual NGN/1k</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((svc) => {
                const autoNGN = rate ? parseFloat((svc.sell_price * rate).toFixed(2)) : null;
                const hasManual = svc.manual_price != null;
                const inputVal = manualInputs[svc.id] !== undefined ? manualInputs[svc.id] : (hasManual ? String(svc.manual_price) : '');
                const isSaving = !!saving[svc.id];
                return (
                  <tr key={svc.id} style={hasManual ? { borderLeft: '2px solid var(--primary)' } : {}}>
                    <td>
                      <input type="checkbox" checked={selectedIds.has(svc.id)}
                        onChange={() => {
                          const n = new Set(selectedIds);
                          if (n.has(svc.id)) n.delete(svc.id); else n.add(svc.id);
                          setSelectedIds(n);
                        }}
                      />
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--blue-muted)', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {svc.platform}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 220 }}>{svc.name}</td>
                    <td>
                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: svc.provider === 'smmraja' ? 'rgba(245,101,101,0.1)' : 'rgba(99,102,241,0.1)', color: svc.provider === 'smmraja' ? '#F56565' : '#6366F1', fontWeight: 700, textTransform: 'uppercase' }}>
                        {svc.provider === 'smmraja' ? 'Raja' : 'JAP'}
                      </span>
                    </td>
                    <td>
                      {autoNGN != null ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>₦{fmt(autoNGN)}</span>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={autoNGN ? fmt(autoNGN) : 'NGN price'}
                          value={inputVal}
                          onChange={(e) => setManualInputs((p) => ({ ...p, [svc.id]: e.target.value }))}
                          style={{ width: 100, height: 30, padding: '0 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-mono)' }}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', height: 30, fontSize: 12 }}
                          disabled={isSaving || inputVal === ''}
                          onClick={() => {
                            const v = parseFloat(inputVal);
                            if (!isNaN(v) && v > 0) saveManualPrice(svc, v);
                          }}
                        >
                          {isSaving ? <span className="spinner" style={{ width: 11, height: 11 }} /> : 'Save'}
                        </button>
                        {hasManual && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 6px', height: 30 }}
                            disabled={isSaving}
                            title="Clear override"
                            onClick={() => saveManualPrice(svc, null)}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      {hasManual && (
                        <div style={{ fontSize: 10, color: 'var(--primary)', marginTop: 2 }}>override active</div>
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleToggle(svc)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: svc.is_active ? 'var(--green)' : 'var(--text-dim)', padding: 0 }}>
                        {svc.is_active ? <><ToggleRight size={20} /><span style={{ fontSize: 11 }}>On</span></> : <><ToggleLeft size={20} /><span style={{ fontSize: 11 }}>Off</span></>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state"><Search size={28} /><h3>No services found</h3></div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16, fontSize: 13 }}>
          <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span style={{ color: 'var(--text-muted)' }}>Page {page + 1} of {pageCount} ({filtered.length} services)</span>
          <button className="btn btn-outline btn-sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── SMS Tab ─────────────────────────────────────────────────────────────────
function SmsTab() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sms-settings');
      setSettings(res.data || []);
    } catch { toast.error('Failed to load SMS settings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return settings;
    const q = search.toLowerCase();
    return settings.filter((s) => s.service_code?.toLowerCase().includes(q) || s.country_name?.toLowerCase().includes(q));
  }, [settings, search]);

  const saveManualPrice = async (row, value) => {
    const key = `${row.service_code}_${row.country_id}`;
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      await api.put('/admin/sms-country-settings', {
        service_code: row.service_code,
        country_id: row.country_id,
        country_name: row.country_name,
        is_hidden: row.is_hidden,
        sort_order: row.sort_order,
        custom_price: row.custom_price,
        manual_price_ngn: value,
      });
      setSettings((prev) => prev.map((s) => s.id === row.id ? { ...s, manual_price_ngn: value } : s));
      toast.success(value === null ? 'Override cleared' : 'Price saved');
      if (value === null) setInputs((p) => { const n = { ...p }; delete n[key]; return n; });
    } catch { toast.error('Save failed'); }
    finally { setSaving((p) => ({ ...p, [key]: false })); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        {settings.length} configured country/product entries · Set <strong>Manual NGN</strong> to override the exchange-rate price for a specific country.
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative', maxWidth: 300 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search service or country…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
      </div>
      <div className="table-wrap"><div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Service Code</th>
              <th>Country</th>
              <th>Custom USD Price</th>
              <th style={{ minWidth: 200 }}>Manual NGN Override</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const key = `${row.service_code}_${row.country_id}`;
              const hasManual = row.manual_price_ngn != null;
              const inputVal = inputs[key] !== undefined ? inputs[key] : (hasManual ? String(row.manual_price_ngn) : '');
              const isSaving = !!saving[key];
              return (
                <tr key={key} style={hasManual ? { borderLeft: '2px solid var(--primary)' } : {}}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{row.service_code}</td>
                  <td style={{ fontSize: 13 }}>{row.country_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {row.custom_price != null ? `$${row.custom_price}` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <input type="number" min="0" step="0.01" placeholder="₦ override"
                        value={inputVal}
                        onChange={(e) => setInputs((p) => ({ ...p, [key]: e.target.value }))}
                        style={{ width: 110, height: 30, padding: '0 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-mono)' }}
                      />
                      <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', height: 30, fontSize: 12 }}
                        disabled={isSaving || inputVal === ''}
                        onClick={() => { const v = parseFloat(inputVal); if (!isNaN(v) && v > 0) saveManualPrice(row, v); }}>
                        {isSaving ? <span className="spinner" style={{ width: 11, height: 11 }} /> : 'Save'}
                      </button>
                      {hasManual && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px', height: 30 }} disabled={isSaving} onClick={() => saveManualPrice(row, null)}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    {hasManual && <div style={{ fontSize: 10, color: 'var(--primary)', marginTop: 2 }}>override active · ₦{fmt(row.manual_price_ngn)}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state"><MessageSquare size={28} /><h3>No SMS settings found</h3><p>Configure country prices from the SMS management page first</p></div>
        )}
      </div></div>
    </div>
  );
}

// ─── AccsZone Tab ─────────────────────────────────────────────────────────────
function AccszoneTab() {
  const [overrides, setOverrides] = useState([]);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState({});
  const [editInputs, setEditInputs] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [ovRes, rateRes] = await Promise.all([
        api.get('/admin/accszone-overrides'),
        api.get('/settings/exchange-rate'),
      ]);
      setOverrides(ovRes.data || []);
      setRate(Number(rateRes.data.value || 2900));
    } catch { toast.error('Failed to load AccsZone overrides'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addOverride = async () => {
    if (!newSlug.trim() || !newPrice) return toast.error('Slug and price are required');
    setAdding(true);
    try {
      const res = await api.put(`/admin/accszone-overrides/${newSlug.trim()}`, { custom_price_ngn: parseFloat(newPrice) });
      setOverrides((prev) => {
        const exists = prev.find((o) => o.slug === res.data.slug);
        return exists ? prev.map((o) => o.slug === res.data.slug ? res.data : o) : [...prev, res.data];
      });
      setNewSlug(''); setNewPrice('');
      toast.success('Override saved');
    } catch { toast.error('Failed to save override'); }
    finally { setAdding(false); }
  };

  const saveEdit = async (slug, value) => {
    setSaving((p) => ({ ...p, [slug]: true }));
    try {
      await api.put(`/admin/accszone-overrides/${slug}`, { custom_price_ngn: parseFloat(value) });
      setOverrides((prev) => prev.map((o) => o.slug === slug ? { ...o, custom_price_ngn: parseFloat(value) } : o));
      setEditInputs((p) => { const n = { ...p }; delete n[slug]; return n; });
      toast.success('Override updated');
    } catch { toast.error('Save failed'); }
    finally { setSaving((p) => ({ ...p, [slug]: false })); }
  };

  const clearOverride = async (slug) => {
    setSaving((p) => ({ ...p, [slug]: true }));
    try {
      await api.delete(`/admin/accszone-overrides/${slug}`);
      setOverrides((prev) => prev.filter((o) => o.slug !== slug));
      toast.success('Override cleared');
    } catch { toast.error('Failed to clear override'); }
    finally { setSaving((p) => ({ ...p, [slug]: false })); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        {overrides.length} price overrides · Without an override, account prices are calculated as <strong>USD price × ₦{rate?.toLocaleString()}</strong>.
      </div>

      {/* Add new override */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 200, margin: 0 }}>
          <label className="form-label">Product Slug</label>
          <input className="form-input" placeholder="e.g. netflix-1-month" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
        </div>
        <div className="form-group" style={{ width: 160, margin: 0 }}>
          <label className="form-label">Price (₦)</label>
          <input type="number" className="form-input" placeholder="5000" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={addOverride} disabled={adding}>
          {adding ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <><Plus size={13} /> Add Override</>}
        </button>
      </div>

      {/* Overrides table */}
      <div className="table-wrap"><div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Product Slug</th>
              <th>Override Price (₦)</th>
              <th style={{ minWidth: 200 }}>Edit Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {overrides.map((o) => {
              const isSaving = !!saving[o.slug];
              const editVal = editInputs[o.slug] !== undefined ? editInputs[o.slug] : '';
              return (
                <tr key={o.slug}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.slug}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                    ₦{fmt(o.custom_price_ngn)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <input type="number" min="0" step="0.01" placeholder="New price ₦"
                        value={editVal}
                        onChange={(e) => setEditInputs((p) => ({ ...p, [o.slug]: e.target.value }))}
                        style={{ width: 120, height: 30, padding: '0 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-mono)' }}
                      />
                      <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', height: 30, fontSize: 12 }}
                        disabled={isSaving || editVal === ''}
                        onClick={() => saveEdit(o.slug, editVal)}>
                        {isSaving ? <span className="spinner" style={{ width: 11, height: 11 }} /> : 'Save'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" disabled={isSaving} onClick={() => clearOverride(o.slug)} style={{ color: 'var(--red)' }}>
                      <X size={13} /> Clear
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {overrides.length === 0 && (
          <div className="empty-state"><DollarSign size={28} /><h3>No overrides set</h3><p>All AccsZone prices will use exchange-rate calculation</p></div>
        )}
      </div></div>
    </div>
  );
}

// ─── Main ServicesManager ─────────────────────────────────────────────────────
export default function ServicesManager() {
  const [tab, setTab] = useState('smm');

  const tabs = [
    { id: 'smm', label: 'SMM Services', icon: <Zap size={14} /> },
    { id: 'sms', label: 'SMS Prices', icon: <MessageSquare size={14} /> },
    { id: 'accszone', label: 'AccsZone', icon: <DollarSign size={14} /> },
  ];

  return (
    <div className="dash-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Services Manager</h1>
          <p className="page-subtitle">Manage prices across all service types</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'smm' && <SmmTab />}
      {tab === 'sms' && <SmsTab />}
      {tab === 'accszone' && <AccszoneTab />}
    </div>
  );
}
