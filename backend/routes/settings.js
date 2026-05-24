const express = require('express');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const router = express.Router();

// Public: get any setting by key
router.get('/:key', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value, updated_at')
      .eq('key', req.params.key)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Setting not found' });
    res.json({ key: req.params.key, value: data.value, updated_at: data.updated_at });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch setting' });
  }
});

// Admin only: upsert a setting
router.put('/:key', auth, adminOnly, async (req, res) => {
  const { value } = req.body;
  if (value === undefined || value === null || value === '') {
    return res.status(400).json({ error: 'value is required' });
  }
  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key: req.params.key, value: String(value), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    res.json({ key: data.key, value: data.value, updated_at: data.updated_at });
  } catch (err) {
    console.error('[settings] upsert:', err.message);
    res.status(500).json({ error: 'Could not update setting' });
  }
});

module.exports = router;
