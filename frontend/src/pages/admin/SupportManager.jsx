import { useState, useEffect, useRef } from 'react';
import { MessageCircle, CheckCircle, RefreshCw, Clock, Send, ArrowLeft, Inbox, Plus, Trash2, Edit2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = { open: '#22C55E', resolved: '#6B7280', bot: '#F59E0B' };
const STATUS_LABELS = { open: 'Open', resolved: 'Resolved', bot: 'Bot' };

const ICON_OPTIONS = [
  { value: 'ti-wallet',          label: 'Wallet' },
  { value: 'ti-package',         label: 'Package' },
  { value: 'ti-clock',           label: 'Clock' },
  { value: 'ti-receipt-refund',  label: 'Refund' },
  { value: 'ti-help-circle',     label: 'Help' },
  { value: 'ti-credit-card',     label: 'Card' },
  { value: 'ti-phone',           label: 'Phone' },
  { value: 'ti-message',         label: 'Message' },
  { value: 'ti-alert-circle',    label: 'Alert' },
  { value: 'ti-info-circle',     label: 'Info' },
  { value: 'ti-truck',           label: 'Delivery' },
  { value: 'ti-shield',          label: 'Security' },
  { value: 'ti-user',            label: 'User' },
  { value: 'ti-settings',        label: 'Settings' },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── CONVERSATIONS TAB ────────────────────────────────────────────────────────
function ConversationsTab() {
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [actioning, setActioning] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/support?status=${filter}`);
      setConversations(res.data || []);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadList(); }, [filter]);

  useEffect(() => {
    if (!selected || selected.status === 'resolved') return;
    const poll = async () => {
      try {
        const { data } = await api.get(`/admin/support/${selected.id}`);
        setMessages(data.messages || []);
        setSelected(data.conversation);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      } catch (_) {}
    };
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [selected?.id, selected?.status]);

  const openThread = async (conv) => {
    setSelected(conv);
    setMessages([]);
    setThreadLoading(true);
    try {
      const { data } = await api.get(`/admin/support/${conv.id}`);
      setMessages(data.messages || []);
      setSelected(data.conversation);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch {
      toast.error('Failed to load thread');
    } finally {
      setThreadLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected || sending) return;
    const body = reply.trim();
    setReply('');
    setSending(true);
    const temp = { id: `t-${Date.now()}`, sender_type: 'admin', body, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, temp]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const { data } = await api.post(`/admin/support/${selected.id}/reply`, { body });
      setMessages((prev) => prev.map((m) => m.id === temp.id ? data : m));
    } catch {
      toast.error('Failed to send reply');
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setReply(body);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selected) return;
    setActioning(true);
    try {
      await api.patch(`/admin/support/${selected.id}/resolve`);
      setSelected((prev) => ({ ...prev, status: 'resolved' }));
      setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: 'resolved' } : c));
      toast.success('Conversation resolved');
    } catch {
      toast.error('Failed to resolve');
    } finally {
      setActioning(false);
    }
  };

  const handleReopen = async () => {
    if (!selected) return;
    setActioning(true);
    try {
      await api.patch(`/admin/support/${selected.id}/reopen`);
      setSelected((prev) => ({ ...prev, status: 'open' }));
      setConversations((prev) => prev.map((c) => c.id === selected.id ? { ...c, status: 'open' } : c));
      toast.success('Conversation reopened');
    } catch {
      toast.error('Failed to reopen');
    } finally {
      setActioning(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  return (
    <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

      {/* Conversation list */}
      <div style={{ width: selected ? 0 : '100%', minWidth: selected ? 0 : 260, maxWidth: 320, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', transition: 'min-width 0.2s' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {[['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: filter === k ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: filter === k ? 'var(--primary)' : 'var(--muted)', transition: 'color 0.15s', fontFamily: 'var(--font-body)' }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
              <Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>No {filter !== 'all' ? filter : ''} conversations</div>
            </div>
          ) : conversations.map((c) => (
            <button key={c.id} onClick={() => openThread(c)} style={{ display: 'block', width: '100%', padding: '12px 16px', background: selected?.id === c.id ? 'var(--surface-raised)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s', fontFamily: 'var(--font-body)' }}
              onMouseEnter={(e) => { if (selected?.id !== c.id) e.currentTarget.style.background = 'var(--surface-raised)'; }}
              onMouseLeave={(e) => { if (selected?.id !== c.id) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[c.status] || '#6B7280', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.users?.full_name || c.users?.email || 'Unknown'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(c.updated_at || c.created_at)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.subject || 'General inquiry'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread panel */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 0' }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.users?.full_name || selected.users?.email}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {selected.subject || 'General inquiry'} · <span style={{ color: STATUS_COLORS[selected.status] }}>{STATUS_LABELS[selected.status]}</span>
              </div>
            </div>
            {selected.status === 'open' ? (
              <button className="btn btn-sm" onClick={handleResolve} disabled={actioning} style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green-border)', fontSize: 12 }}>
                <CheckCircle size={13} /> Resolve
              </button>
            ) : selected.status === 'resolved' ? (
              <button className="btn btn-ghost btn-sm" onClick={handleReopen} disabled={actioning} style={{ fontSize: 12 }}>
                <RefreshCw size={13} /> Reopen
              </button>
            ) : null}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {threadLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, paddingTop: 32 }}>Loading thread…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, paddingTop: 32 }}>No messages yet.</div>
            ) : messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.sender_type === 'user' ? 'flex-start' : 'flex-end', gap: 8 }}>
                {m.sender_type === 'user' && (
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
                      {(selected.users?.full_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  <div style={{ padding: '9px 13px', borderRadius: m.sender_type === 'user' ? '4px 12px 12px 12px' : '12px 4px 12px 12px', background: m.sender_type === 'user' ? 'var(--surface-raised)' : 'var(--primary)', color: m.sender_type === 'user' ? 'var(--text)' : '#fff', fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word', border: m.sender_type === 'user' ? '1px solid var(--border)' : 'none' }}>
                    {m.body}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textAlign: m.sender_type === 'user' ? 'left' : 'right', paddingLeft: 4, paddingRight: 4 }}>
                    {timeAgo(m.created_at)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {selected.status !== 'resolved' ? (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
              <textarea
                ref={inputRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Reply to customer…"
                rows={1}
                style={{ flex: 1, resize: 'none', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto' }}
              />
              <button onClick={sendReply} disabled={!reply.trim() || sending} className="btn btn-primary btn-sm" style={{ flexShrink: 0, height: 36, padding: '0 14px', opacity: !reply.trim() || sending ? 0.5 : 1 }}>
                <Send size={14} /> Send
              </button>
            </div>
          ) : (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
              This conversation is resolved. Reopen to reply.
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexDirection: 'column', gap: 10 }}>
          <MessageCircle size={40} style={{ opacity: 0.2 }} />
          <span style={{ fontSize: 13 }}>Select a conversation</span>
        </div>
      )}
    </div>
  );
}

// ─── BOT TOPICS TAB ───────────────────────────────────────────────────────────
const BLANK_TOPIC = { icon: 'ti-help-circle', label: '', reply: '', escalate: false, sort_order: 0 };

function BotTopicsTab() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // topic id being edited, or 'new'
  const [form, setForm] = useState(BLANK_TOPIC);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/support/bot-topics');
      setTopics(data || []);
    } catch {
      toast.error('Failed to load bot topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setForm({ ...BLANK_TOPIC, sort_order: topics.length + 1 });
    setEditingId('new');
  };

  const startEdit = (t) => {
    setForm({ icon: t.icon, label: t.label, reply: t.reply || '', escalate: t.escalate, sort_order: t.sort_order });
    setEditingId(t.id);
  };

  const cancelEdit = () => { setEditingId(null); setForm(BLANK_TOPIC); };

  const save = async () => {
    if (!form.label.trim()) return toast.error('Label is required');
    setSaving(true);
    try {
      const payload = {
        icon: form.icon,
        label: form.label.trim(),
        reply: form.escalate ? null : (form.reply.trim() || null),
        escalate: form.escalate,
        sort_order: parseInt(form.sort_order) || 0,
      };
      if (editingId === 'new') {
        const { data } = await api.post('/admin/support/bot-topics', payload);
        setTopics((prev) => [...prev, data]);
        toast.success('Topic created');
      } else {
        const { data } = await api.patch(`/admin/support/bot-topics/${editingId}`, payload);
        setTopics((prev) => prev.map((t) => t.id === editingId ? data : t));
        toast.success('Topic updated');
      }
      cancelEdit();
    } catch {
      toast.error('Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t) => {
    try {
      const { data } = await api.patch(`/admin/support/bot-topics/${t.id}`, { active: !t.active });
      setTopics((prev) => prev.map((x) => x.id === t.id ? data : x));
    } catch {
      toast.error('Failed to update topic');
    }
  };

  const deleteTopic = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/admin/support/bot-topics/${id}`);
      setTopics((prev) => prev.filter((t) => t.id !== id));
      toast.success('Topic deleted');
    } catch {
      toast.error('Failed to delete topic');
    } finally {
      setDeletingId(null);
    }
  };

  const fld = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Bot FAQ Topics</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>These appear in the customer chat widget as quick-answer buttons.</div>
        </div>
        {editingId !== 'new' && (
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            <Plus size={14} /> Add Topic
          </button>
        )}
      </div>

      {/* New topic form */}
      {editingId === 'new' && (
        <TopicForm form={form} fld={fld} saving={saving} onSave={save} onCancel={cancelEdit} isNew />
      )}

      {/* Topic list */}
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
      ) : topics.length === 0 && editingId !== 'new' ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No topics yet. Click "Add Topic" to create your first FAQ entry.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topics.map((t) => (
            <div key={t.id}>
              {editingId === t.id ? (
                <TopicForm form={form} fld={fld} saving={saving} onSave={save} onCancel={cancelEdit} />
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, opacity: t.active ? 1 : 0.5 }}>
                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${t.icon}`} style={{ fontSize: 16, color: 'var(--primary)' }} />
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.label}</span>
                      {t.escalate && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}>Escalates to agent</span>
                      )}
                      {!t.active && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: 'var(--surface-raised)', color: 'var(--muted)' }}>Hidden</span>
                      )}
                    </div>
                    {!t.escalate && t.reply && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {t.reply}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Order: {t.sort_order}</div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button title={t.active ? 'Hide from chat' : 'Show in chat'} onClick={() => toggleActive(t)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: t.active ? 'var(--green)' : 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                      {t.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    </button>
                    <button title="Edit" onClick={() => startEdit(t)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                      <Edit2 size={13} />
                    </button>
                    <button title="Delete" onClick={() => deleteTopic(t.id)} disabled={deletingId === t.id} style={{ background: 'none', border: '1px solid rgba(248,113,113,.3)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--red, #F87171)', display: 'flex', alignItems: 'center', opacity: deletingId === t.id ? 0.5 : 1 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicForm({ form, fld, saving, onSave, onCancel, isNew }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{isNew ? 'New Topic' : 'Edit Topic'}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* Label */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>BUTTON LABEL *</label>
          <input
            value={form.label}
            onChange={fld('label')}
            placeholder="e.g. Wallet & Funding"
            style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Icon */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>ICON</label>
          <select
            value={form.icon}
            onChange={fld('icon')}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}
          >
            {ICON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
            ))}
          </select>
        </div>

        {/* Sort order */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>SORT ORDER</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={fld('sort_order')}
            min={0}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Escalate toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.escalate} onChange={fld('escalate')} style={{ width: 15, height: 15, cursor: 'pointer' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Escalate directly to agent</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Skip bot reply — connect user to human support immediately</div>
        </div>
      </label>

      {/* Reply text */}
      {!form.escalate && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>BOT REPLY</label>
          <textarea
            value={form.reply}
            onChange={fld('reply')}
            placeholder="Type the automated reply the bot will show for this topic…"
            rows={4}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.55 }}
          />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>The user will also see "Yes thanks!" and "I still need help" buttons after this reply.</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
          <Save size={13} /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SupportManager() {
  const [tab, setTab] = useState('conversations');

  return (
    <div className="dash-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Support</h1>
          <p className="page-subtitle">Manage customer conversations and bot FAQ topics</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16, flexShrink: 0 }}>
        {[['conversations', 'Conversations'], ['bot', 'Bot Topics']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === k ? 'var(--primary)' : 'var(--muted)', transition: 'color 0.15s', fontFamily: 'var(--font-body)' }}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'conversations' ? <ConversationsTab /> : <BotTopicsTab />}
    </div>
  );
}
