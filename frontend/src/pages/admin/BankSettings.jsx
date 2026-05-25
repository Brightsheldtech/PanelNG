import { useState, useEffect } from 'react';
import {
  Building2, Plus, Trash2, ToggleLeft, ToggleRight,
  Mail, Save, Info, Pencil, X, Check,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BankSettings() {
  const [banks, setBanks] = useState([]);
  const [settings, setSettings] = useState({ admin_email: '', gmail_user: '', usd_ngn_rate: '2900' });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingBank, setEditingBank] = useState(null); // bank id being edited
  const [deletingId, setDeletingId] = useState(null);

  // Add bank form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [addingBank, setAddingBank] = useState(false);

  // Edit bank inline
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    Promise.all([api.get('/admin/bank-details'), api.get('/admin/settings')])
      .then(([bankRes, settingsRes]) => {
        setBanks(bankRes.data || []);
        const s = settingsRes.data || {};
        setSettings({ admin_email: s.admin_email || '', gmail_user: s.gmail_user || '', usd_ngn_rate: s.usd_ngn_rate || '2900' });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  // ── Bank accounts ────────────────────────────────────────

  const handleAddBank = async (e) => {
    e.preventDefault();
    if (!newBank.bank_name || !newBank.account_number || !newBank.account_name) {
      return toast.error('All bank fields are required');
    }
    setAddingBank(true);
    try {
      const res = await api.post('/admin/bank-details', newBank);
      setBanks((prev) => [...prev, res.data]);
      setNewBank({ bank_name: '', account_number: '', account_name: '' });
      setShowAddForm(false);
      toast.success('Bank account added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add bank account');
    } finally {
      setAddingBank(false);
    }
  };

  const handleToggleActive = async (bank) => {
    try {
      const res = await api.patch(`/admin/bank-details/${bank.id}`, { is_active: !bank.is_active });
      setBanks((prev) => prev.map((b) => b.id === bank.id ? res.data : b));
      toast.success(res.data.is_active ? 'Bank account activated' : 'Bank account hidden from customers');
    } catch {
      toast.error('Failed to update bank account');
    }
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm('Remove this bank account? Customers will no longer see it.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/bank-details/${id}`);
      setBanks((prev) => prev.filter((b) => b.id !== id));
      toast.success('Bank account removed');
    } catch {
      toast.error('Failed to remove bank account');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditStart = (bank) => {
    setEditingBank(bank.id);
    setEditValues({ bank_name: bank.bank_name, account_number: bank.account_number, account_name: bank.account_name });
  };

  const handleEditSave = async (id) => {
    try {
      const res = await api.patch(`/admin/bank-details/${id}`, editValues);
      setBanks((prev) => prev.map((b) => b.id === id ? res.data : b));
      setEditingBank(null);
      toast.success('Bank account updated');
    } catch {
      toast.error('Failed to update bank account');
    }
  };

  // ── Email settings ───────────────────────────────────────

  const handleSaveSetting = async (key) => {
    setSavingSettings(true);
    try {
      await api.patch('/admin/settings', { key, value: settings[key] });
      toast.success('Setting saved');
    } catch {
      toast.error('Failed to save setting');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" /></div>;
  }

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">Bank &amp; Notification Settings</h1>
        <p className="page-subtitle">Manage deposit accounts and email notifications</p>
      </div>

      {/* ── Bank Accounts ── */}
      <div className="card card-lg" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} color="var(--primary)" />
            <span className="card-title">Bank Accounts</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Account</>}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form onSubmit={handleAddBank} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 18, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Bank Name</label>
                <input className="form-input" placeholder="e.g. GTBank" value={newBank.bank_name} onChange={(e) => setNewBank((p) => ({ ...p, bank_name: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Account Number</label>
                <input className="form-input" placeholder="0123456789" value={newBank.account_number} onChange={(e) => setNewBank((p) => ({ ...p, account_number: e.target.value }))} maxLength={20} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Account Name</label>
                <input className="form-input" placeholder="Full account name" value={newBank.account_name} onChange={(e) => setNewBank((p) => ({ ...p, account_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={addingBank}>
                {addingBank ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Plus size={13} />}
                Add Bank Account
              </button>
            </div>
          </form>
        )}

        {/* Bank list */}
        {banks.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <Building2 size={28} />
            <h3>No bank accounts</h3>
            <p>Add a bank account for customers to transfer to</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {banks.map((bank) => (
              <div
                key={bank.id}
                style={{
                  background: 'var(--bg)', border: `1px solid ${bank.is_active ? 'var(--border)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '14px 18px', opacity: bank.is_active ? 1 : 0.5,
                  borderLeft: `3px solid ${bank.is_active ? 'var(--green)' : 'var(--border)'}`,
                }}
              >
                {editingBank === bank.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <input className="form-input" value={editValues.bank_name} onChange={(e) => setEditValues((p) => ({ ...p, bank_name: e.target.value }))} placeholder="Bank name" style={{ fontSize: 13 }} />
                      <input className="form-input" value={editValues.account_number} onChange={(e) => setEditValues((p) => ({ ...p, account_number: e.target.value }))} placeholder="Account number" style={{ fontSize: 13 }} />
                      <input className="form-input" value={editValues.account_name} onChange={(e) => setEditValues((p) => ({ ...p, account_name: e.target.value }))} placeholder="Account name" style={{ fontSize: 13 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleEditSave(bank.id)}><Check size={13} /> Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingBank(null)}><X size={13} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{bank.bank_name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.05em', marginBottom: 2 }}>{bank.account_number}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{bank.account_name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: bank.is_active ? 'var(--green)' : 'var(--text-dim)', fontWeight: 700 }}>
                        {bank.is_active ? 'Active' : 'Hidden'}
                      </span>
                      <button
                        title={bank.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleActive(bank)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: bank.is_active ? 'var(--green)' : 'var(--text-dim)', display: 'flex', padding: 4 }}
                      >
                        {bank.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        title="Edit"
                        onClick={() => handleEditStart(bank)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDeleteBank(bank.id)}
                        disabled={deletingId === bank.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 6, opacity: deletingId === bank.id ? 0.5 : 1 }}
                      >
                        {deletingId === bank.id ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Email Notification Settings ── */}
      <div className="card card-lg">
        <div className="card-header" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={16} color="var(--primary)" />
            <span className="card-title">Email Notifications</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Admin email */}
          <div className="form-group">
            <label className="form-label">Admin Notification Email</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="email"
                className="form-input"
                value={settings.admin_email}
                onChange={(e) => setSettings((p) => ({ ...p, admin_email: e.target.value }))}
                placeholder="admin@example.com"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSaveSetting('admin_email')}
                disabled={savingSettings}
                style={{ flexShrink: 0 }}
              >
                {savingSettings ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Save size={13} />}
                Save
              </button>
            </div>
            <span className="form-hint">All payment request notifications are sent to this address</span>
          </div>

          {/* Gmail sender */}
          <div className="form-group">
            <label className="form-label">Gmail Sender Address</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="email"
                className="form-input"
                value={settings.gmail_user}
                onChange={(e) => setSettings((p) => ({ ...p, gmail_user: e.target.value }))}
                placeholder="yourname@gmail.com"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSaveSetting('gmail_user')}
                disabled={savingSettings}
                style={{ flexShrink: 0 }}
              >
                {savingSettings ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Save size={13} />}
                Save
              </button>
            </div>
            <span className="form-hint">Notifications are sent from this Gmail account</span>
          </div>

          {/* USD / NGN exchange rate */}
          <div className="form-group">
            <label className="form-label">USD → NGN Exchange Rate</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number"
                className="form-input"
                value={settings.usd_ngn_rate}
                onChange={(e) => setSettings((p) => ({ ...p, usd_ngn_rate: e.target.value }))}
                placeholder="e.g. 2900"
                style={{ flex: 1, maxWidth: 200 }}
                min={1}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSaveSetting('usd_ngn_rate')}
                disabled={savingSettings}
                style={{ flexShrink: 0 }}
              >
                {savingSettings ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Save size={13} />}
                Save
              </button>
            </div>
            <span className="form-hint">Used to display HeroSMS prices in Naira on the SMS Manager</span>
          </div>

          {/* Password note */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px', display: 'flex', gap: 12 }}>
            <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Gmail App Password</strong> is set in the server's <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg)', padding: '1px 6px', borderRadius: 3 }}>.env</code> file as <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg)', padding: '1px 6px', borderRadius: 3 }}>GMAIL_APP_PASSWORD</code>. To change it: update that file and restart the server. The app password is a 16-character code — find it at <strong style={{ color: 'var(--text)' }}>Google Account → Security → App passwords</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
