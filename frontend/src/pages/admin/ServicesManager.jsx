import { useEffect, useState, useMemo } from 'react';
import { Settings, RefreshCw, ToggleLeft, ToggleRight, Plus, Download, Search } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

function EditRow({ service, onSave, onCancel }) {
  const [form, setForm] = useState({
    sell_price: service.sell_price,
    min_quantity: service.min_quantity,
    max_quantity: service.max_quantity,
    sort_order: service.sort_order ?? 999,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(service.id, form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr style={{ background: 'var(--primary-muted)' }}>
      <td colSpan={2} className="td-mono td-muted" style={{ fontSize: 11 }}>{service.panel_service_id}</td>
      <td>
        <input
          type="number"
          className="form-input"
          value={form.sell_price}
          onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
          style={{ width: 120, padding: '5px 10px', fontSize: 13 }}
          step="0.01"
        />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>₦ per 1000</div>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="number"
            className="form-input"
            value={form.min_quantity}
            onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
            style={{ width: 80, padding: '5px 8px', fontSize: 13 }}
          />
          <input
            type="number"
            className="form-input"
            value={form.max_quantity}
            onChange={(e) => setForm({ ...form, max_quantity: e.target.value })}
            style={{ width: 90, padding: '5px 8px', fontSize: 13 }}
          />
        </div>
      </td>
      <td>
        <input
          type="number"
          className="form-input"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          style={{ width: 70, padding: '5px 8px', fontSize: 13 }}
          min={1}
          title="Lower = appears first"
        />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>priority</div>
      </td>
      <td colSpan={2}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-success btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Save'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      </td>
    </tr>
  );
}

function AddServiceModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ platform: '', name: '', panel_service_id: '', cost_price: '', sell_price: '', min_quantity: 100, max_quantity: 10000 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/services', form);
      onAdded(res.data);
      toast.success('Service added');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }}>
        <h3 style={{ fontFamily: 'var(--font-brand)', marginBottom: 20 }}>Add New Service</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Platform</label>
              <input className="form-input" placeholder="Instagram" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">JAP Service ID</label>
              <input className="form-input" placeholder="e.g. 123" value={form.panel_service_id} onChange={(e) => setForm({ ...form, panel_service_id: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Service Name</label>
            <input className="form-input" placeholder="Instagram Followers" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Cost Price (₦/1000)</label>
              <input type="number" className="form-input" placeholder="0.00" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Sell Price (₦/1000)</label>
              <input type="number" className="form-input" placeholder="0.00" step="0.01" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} required />
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

export default function ServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');

  const load = () => {
    setLoading(true);
    api.get('/admin/services')
      .then((r) => setServices(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const platforms = useMemo(() => ['All', ...Array.from(new Set(services.map((s) => s.platform))).sort()], [services]);

  const filtered = useMemo(() => {
    let list = services;
    if (platformFilter !== 'All') list = list.filter((s) => s.platform === platformFilter);
    if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.panel_service_id.includes(search));
    return list;
  }, [services, platformFilter, search]);

  const handleToggle = async (svc) => {
    try {
      const updated = await api.patch('/admin/services', { id: svc.id, is_active: !svc.is_active });
      setServices((prev) => prev.map((s) => (s.id === svc.id ? updated.data : s)));
      toast.success(svc.is_active ? 'Service disabled' : 'Service enabled');
    } catch {
      toast.error('Toggle failed');
    }
  };

  const handleSave = async (id, form) => {
    try {
      const res = await api.patch('/admin/services', { id, ...form });
      setServices((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      setEditingId(null);
      toast.success('Service updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/admin/sync-services');
      toast.success(`Synced ${res.data.synced} of ${res.data.total} services from JAP`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  return (
    <div className="dash-page">
      {showAdd && <AddServiceModal onClose={() => setShowAdd(false)} onAdded={(s) => setServices((prev) => [s, ...prev])} />}

      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Services Manager</h1>
          <p className="page-subtitle">{services.length} services · {services.filter((s) => s.is_active).length} active</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} />
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleSync} disabled={syncing}>
            {syncing ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Download size={13} />}
            {syncing ? 'Syncing…' : 'Sync from JAP'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <Plus size={13} /> Add Service
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search services…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30, width: 220 }} />
        </div>
        <select className="form-select" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} style={{ width: 160 }}>
          {platforms.map((p) => <option key={p}>{p}</option>)}
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
                  <th>Platform</th>
                  <th>Service Name</th>
                  <th>Cost / Sell (/1000)</th>
                  <th>Min / Max Qty</th>
                  <th>Priority</th>
                  <th>JAP ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((svc) =>
                  editingId === svc.id ? (
                    <EditRow
                      key={svc.id}
                      service={svc}
                      onSave={handleSave}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={svc.id}>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--blue-muted)', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {svc.platform}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, maxWidth: 260 }}>{svc.name}</td>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                          ₦{fmt(svc.cost_price)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                          ₦{fmt(svc.sell_price)}
                        </div>
                        {svc.cost_price > 0 && (
                          <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 1 }}>
                            +{(((svc.sell_price - svc.cost_price) / svc.cost_price) * 100).toFixed(0)}% margin
                          </div>
                        )}
                      </td>
                      <td className="td-mono" style={{ fontSize: 12 }}>
                        {svc.min_quantity?.toLocaleString()} – {svc.max_quantity?.toLocaleString()}
                      </td>
                      <td className="td-mono td-muted" style={{ fontSize: 13 }}>
                        {svc.sort_order ?? 999}
                      </td>
                      <td className="td-mono td-muted" style={{ fontSize: 12 }}>{svc.panel_service_id}</td>
                      <td>
                        <button
                          onClick={() => handleToggle(svc)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: svc.is_active ? 'var(--green)' : 'var(--text-dim)', padding: 0 }}
                        >
                          {svc.is_active
                            ? <><ToggleRight size={20} /> <span style={{ fontSize: 11 }}>Active</span></>
                            : <><ToggleLeft size={20} /> <span style={{ fontSize: 11 }}>Off</span></>
                          }
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setEditingId(svc.id)}
                        >
                          <Settings size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <Settings size={28} />
                <h3>No services found</h3>
                <p>Add a service manually or sync from JAP</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
