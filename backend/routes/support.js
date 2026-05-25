const express = require('express');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/support/start — get active conversation or create one
router.post('/start', auth, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('support_conversations')
      .select('id, status, subject')
      .eq('user_id', req.user.id)
      .in('status', ['bot', 'open'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) return res.json(existing);

    const { data, error } = await supabase
      .from('support_conversations')
      .insert({ user_id: req.user.id, status: 'bot' })
      .select('id, status, subject')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('support/start error:', err.message);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// GET /api/support/:id/messages — poll messages for a conversation
router.get('/:id/messages', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: conv } = await supabase
      .from('support_conversations')
      .select('id, status, subject')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    if (!conv) return res.status(404).json({ error: 'Not found' });

    const { data, error } = await supabase
      .from('support_messages')
      .select('id, sender_type, body, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;

    res.json({ conversation: conv, messages: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/support/:id/message — user sends a message
router.post('/:id/message', auth, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Message is required' });

  try {
    const { data: conv } = await supabase
      .from('support_conversations')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    if (!conv) return res.status(404).json({ error: 'Not found' });
    if (conv.status === 'resolved') return res.status(400).json({ error: 'This conversation is resolved' });

    const { data, error } = await supabase
      .from('support_messages')
      .insert({ conversation_id: id, sender_type: 'user', body: body.trim() })
      .select('id, sender_type, body, created_at')
      .single();
    if (error) throw error;

    await supabase
      .from('support_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PATCH /api/support/:id/escalate — move conversation from bot to human
router.patch('/:id/escalate', auth, async (req, res) => {
  const { id } = req.params;
  const { subject } = req.body;
  try {
    const { data, error } = await supabase
      .from('support_conversations')
      .update({ status: 'open', subject: subject || null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id, status, subject')
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to escalate conversation' });
  }
});

module.exports = router;
