const express = require('express');
const axios = require('axios');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

const AZ_BASE = (process.env.ACCSZONE_BASE_URL || 'https://accszone.com/api/v1').replace(/\/$/, '');
const AZ_KEY = process.env.ACCSZONE_API_KEY;

const az = axios.create({
  baseURL: AZ_BASE,
  headers: { 'X-API-Key': AZ_KEY, 'Accept': 'application/json' },
  timeout: 15000,
});

// Simple in-memory cache (5 min TTL)
const cache = new Map();
const TTL = 5 * 60 * 1000;
const getCached = (k) => { const e = cache.get(k); return e && Date.now() - e.ts < TTL ? e.data : null; };
const setCached = (k, d) => cache.set(k, { data: d, ts: Date.now() });

// ── GET /api/accszone/categories ─────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const cached = getCached('categories');
    if (cached) return res.json(cached);
    const { data } = await az.get('/categories');
    setCached('categories', data);
    res.json(data);
  } catch (err) {
    console.error('[accszone] categories:', err.message);
    res.status(502).json({ error: 'Could not fetch categories' });
  }
});

// ── GET /api/accszone/categories/:id/subcategories ───────────────────────────
router.get('/categories/:id/subcategories', async (req, res) => {
  try {
    const key = `subcats_${req.params.id}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    const { data } = await az.get(`/categories/${req.params.id}/subcategories`);
    setCached(key, data);
    res.json(data);
  } catch (err) {
    console.error('[accszone] subcategories:', err.message);
    res.status(502).json({ error: 'Could not fetch subcategories' });
  }
});

// ── GET /api/accszone/listings ───────────────────────────────────────────────
router.get('/listings', async (req, res) => {
  try {
    const key = `listings_${JSON.stringify(req.query)}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    const { data } = await az.get('/listings', { params: req.query });
    setCached(key, data);
    res.json(data);
  } catch (err) {
    console.error('[accszone] listings:', err.message);
    res.status(502).json({ error: 'Could not fetch listings' });
  }
});

// ── GET /api/accszone/listings/:slug ─────────────────────────────────────────
router.get('/listings/:slug', async (req, res) => {
  try {
    const key = `listing_${req.params.slug}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    const { data } = await az.get(`/listings/${req.params.slug}`);
    setCached(key, data);
    res.json(data);
  } catch (err) {
    console.error('[accszone] listing detail:', err.message);
    res.status(502).json({ error: 'Could not fetch product details' });
  }
});

// ── POST /api/accszone/order ─────────────────────────────────────────────────
router.post('/order', auth, async (req, res) => {
  const { ad_id, quantity, listing_slug, unit_price, product_name, platform } = req.body;

  if (!ad_id || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'ad_id and quantity are required' });
  }

  try {
    // Verify price server-side
    let unitPrice = Number(unit_price);
    let productName = product_name || 'Account Order';

    if (listing_slug) {
      try {
        const key = `listing_${listing_slug}`;
        const cached = getCached(key);
        const listing = cached || (await az.get(`/listings/${listing_slug}`)).data;
        if (!cached) setCached(key, listing);
        unitPrice = Number(listing.price || listing.unit_price || unit_price);
        productName = listing.title || listing.name || product_name;
      } catch (_) {
        // fall through to provided price
      }
    }

    if (!unitPrice || isNaN(unitPrice)) {
      return res.status(400).json({ error: 'Could not determine product price' });
    }

    const totalCost = parseFloat((unitPrice * quantity).toFixed(2));

    // Check wallet balance
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', req.user.id)
      .single();

    if (userErr || !user) return res.status(400).json({ error: 'Could not verify wallet balance' });

    if (Number(user.wallet_balance) < totalCost) {
      return res.status(402).json({
        error: 'Insufficient wallet balance',
        required: totalCost,
        available: Number(user.wallet_balance),
      });
    }

    // Place order with ACCSZONE
    const { data: orderResult } = await az.post('/purchase', { ad_id: Number(ad_id), quantity: Number(quantity) });

    // Deduct wallet
    await supabase
      .from('users')
      .update({ wallet_balance: Number(user.wallet_balance) - totalCost })
      .eq('id', req.user.id);

    // Save order to Supabase
    const { data: savedOrder } = await supabase
      .from('accszone_orders')
      .insert({
        user_id: req.user.id,
        accszone_order_id: String(orderResult?.order_id || orderResult?.id || ''),
        product_id: String(ad_id),
        product_name: productName,
        platform: platform || 'Other',
        quantity: Number(quantity),
        unit_price: unitPrice,
        total_cost: totalCost,
        status: 'completed',
        delivered_data: orderResult?.accounts || orderResult?.data || orderResult || null,
      })
      .select()
      .single();

    res.json({
      success: true,
      order: savedOrder,
      accounts: orderResult?.accounts || orderResult?.data || [],
      new_balance: Number(user.wallet_balance) - totalCost,
    });
  } catch (err) {
    console.error('[accszone] order:', err.response?.data || err.message);
    const msg = err.response?.data?.message || err.response?.data?.error || 'Order failed. Your wallet was not charged.';
    res.status(502).json({ error: msg });
  }
});

// ── GET /api/accszone/orders ──────────────────────────────────────────────────
router.get('/orders', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accszone_orders')
      .select('id, accszone_order_id, product_name, platform, quantity, unit_price, total_cost, status, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[accszone] fetch orders:', err.message);
    res.status(500).json({ error: 'Could not fetch orders' });
  }
});

// ── GET /api/accszone/orders/:id ──────────────────────────────────────────────
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accszone_orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Order not found' });
    res.json(data);
  } catch (err) {
    console.error('[accszone] fetch order:', err.message);
    res.status(500).json({ error: 'Could not fetch order' });
  }
});

module.exports = router;
