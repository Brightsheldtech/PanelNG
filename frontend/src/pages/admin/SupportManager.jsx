import { useState, useEffect, useRef } from 'react';
import { MessageCircle, CheckCircle, RefreshCw, Clock, Send, ArrowLeft, Inbox } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = { open: '#22C55E', resolved: '#6B7280', bot: '#F59E0B' };
const STATUS_LABELS = { open: 'Open', resolved: 'Resolved', bot: 'Bot' };

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SupportManager() {
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // full thread
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

  // Poll active thread
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
    <div className="dash-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header flex justify-between items-center" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Support</h1>
          <p className="page-subtitle">Live customer conversations</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadList}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

        {/* Conversation list */}
        <div style={{ width: selected ? 0 : '100%', minWidth: selected ? 0 : 260, maxWidth: 320, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', transition: 'min-width 0.2s' }}
          className="support-list-panel">

          {/* Filter tabs */}
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

            {/* Thread header */}
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

            {/* Messages */}
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

            {/* Reply input */}
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
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0, height: 36, padding: '0 14px', opacity: !reply.trim() || sending ? 0.5 : 1 }}
                >
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
    </div>
  );
}
