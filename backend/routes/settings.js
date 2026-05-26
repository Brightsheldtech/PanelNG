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

// Admin: upload hero image to Supabase Storage (base64 JSON, no multer needed)
router.post('/upload/hero-image', auth, adminOnly, async (req, res) => {
  const { filename, mimeType, data } = req.body;
  if (!filename || !mimeType || !data) {
    return res.status(400).json({ error: 'filename, mimeType and data are required' });
  }
  try {
    const buffer = Buffer.from(data, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `hero/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(path, buffer, { contentType: mimeType, upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    await supabase.from('settings').upsert({
      key: 'hero_image_url', value: publicUrl, updated_at: new Date().toISOString(),
    });

    res.json({ url: publicUrl });
  } catch (err) {
    console.error('[hero upload]:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Admin: clear hero image
router.delete('/hero-image', auth, adminOnly, async (req, res) => {
  try {
    await supabase.from('settings').upsert({
      key: 'hero_image_url', value: '', updated_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[hero remove]:', err.message);
    res.status(500).json({ error: 'Could not remove image' });
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
