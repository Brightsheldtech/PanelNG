const express = require('express');
const axios = require('axios');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { getExchangeRate } = require('../lib/exchangeRate');

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

// Fetch ALL listings across all pages and cache the combined array
async function fetchAllListings() {
  const cached = getCached('_all_listings');
  if (cached) return cached;

  let all = [];
  let page = 1;
  let lastPage = 1;

  do {
    const { data } = await az.get('/listings', { params: { page, per_page: 100 } });
    const items = Array.isArray(data) ? data : (data?.data || []);
    all = all.concat(items);
    lastPage = data?.meta?.last_page || 1;
    page++;
  } while (page <= lastPage && all.length < 5000); // safety cap

  setCached('_all_listings', all);
  return all;
}

// Map ACCSZONE category.title → chip name (mirrors frontend CATEGORY_CHIP_MAP)
const CATEGORY_CHIP_MAP = {
  'facebook accounts':'Facebook','instagram accounts':'Instagram','tiktok':'TikTok',
  'twitter/x accounts':'Twitter/X','youtube accounts & channels':'YouTube',
  'whatsapp accounts':'WhatsApp','snapchat accounts':'Snapchat','telegram accounts':'Telegram',
  'discord accounts':'Discord','linkedin accounts':'LinkedIn','reddit accounts':'Reddit',
  'pinterest accounts':'Pinterest','threads':'Threads','bluesky':'Bluesky',
  'gmail accounts':'Gmail','google voice accounts':'Gmail','google ads accounts':'Gmail',
  'outlook email accounts':'Outlook',
  'gmx email accounts':'Email','yahoo mail':'Email','zoho mail':'Email',
  'aol mail':'Email','onet pl':'Email','protonmail accounts':'Email','usa email & phone leads':'Email',
  'apple':'Apple ID','apple id & gift cards':'Apple ID',
  'netflix accounts & gift cards':'Netflix','spotify premium':'Spotify',
  'streaming media':'Streaming',
  'amazon accounts':'Amazon','amazon gift cards':'Amazon',
  'playstation gift cards':'Gaming','steam gift cards':'Gaming','google play gift cards':'Gaming',
  'binance verified account':'Crypto','cashapp accounts':'Crypto',
  'vpn premium':'VPN','windows vps / rdp server':'VPN',
  'mobile proxies':'Proxy',
  'badoo dating accounts':'Dating','bumble dating accounts':'Dating',
  'grindr dating accounts':'Dating','meetme dating accounts':'Dating',
  'eharmony dating':'Dating','taimi dating accounts':'Dating','dating app accounts':'Dating',
};

function categoryToChip(catTitle = '') {
  return CATEGORY_CHIP_MAP[(catTitle || '').toLowerCase()] || 'Other';
}

// Fetch price overrides map { slug -> custom_price_ngn }
async function getPriceOverrides() {
  const cached = getCached('_price_overrides');
  if (cached) return cached;
  const { data, error } = await supabase.from('accszone_price_overrides').select('slug, custom_price_ngn');
  if (error) return {};
  const map = {};
  (data || []).forEach((r) => { map[r.slug] = Number(r.custom_price_ngn); });
  setCached('_price_overrides', map);
  return map;
}

// Apply sell price to a listing array or single listing
async function applyPrices(listings) {
  const rate = await getExchangeRate();
  const overrides = await getPriceOverrides();
  const apply = (l) => {
    const slug = l.slug || l.ad_id || String(l.id || '');
    const autoNGN = parseFloat((Number(l.price || l.unit_price || 0) * rate).toFixed(2));
    const sellNGN = overrides[slug] != null ? overrides[slug] : autoNGN;
    const platform = categoryToChip(l.category?.title);
    return { ...l, _auto_price_ngn: autoNGN, _sell_price_ngn: sellNGN, _platform: platform };
  };
  return Array.isArray(listings) ? listings.map(apply) : apply(listings);
}

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
    // Always return all listings (all pages combined) with prices applied
    const all = await fetchAllListings();
    const result = await applyPrices(all);
    res.json(result);
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
    // ACCSZONE wraps detail in { success: true, data: {...} }
    const listing = data?.data || data;
    setCached(key, listing);
    res.json(listing);
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
    let unitPrice = Number(unit_price);
    let productName = product_name || 'Account Order';
    let usedCustomPrice = false;

    if (listing_slug) {
      try {
        // Check for admin price override first
        const overrides = await getPriceOverrides();
        if (overrides[listing_slug] != null) {
          unitPrice = overrides[listing_slug];
          usedCustomPrice = true;
        }

        const key = `listing_${listing_slug}`;
        const cached = getCached(key);
        let listing;
        if (cached) {
          listing = cached;
        } else {
          const { data: raw } = await az.get(`/listings/${listing_slug}`);
          listing = raw?.data || raw;
          setCached(key, listing);
        }

        if (!usedCustomPrice) {
          const rate = await getExchangeRate();
          const rawUSD = Number(listing.price || listing.unit_price || unit_price);
          unitPrice = parseFloat((rawUSD * rate).toFixed(2));
        }
        productName = listing.title || listing.name || product_name;
      } catch (_) {
        // fall through to provided price
      }
    }

    if (!unitPrice || isNaN(unitPrice)) {
      return res.status(400).json({ error: 'Could not determine product price' });
    }

    const totalCostNGN = parseFloat((unitPrice * quantity).toFixed(2));

    // Check wallet balance (NGN)
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', req.user.id)
      .single();

    if (userErr || !user) return res.status(400).json({ error: 'Could not verify wallet balance' });

    if (Number(user.wallet_balance) < totalCostNGN) {
      return res.status(402).json({
        error: 'Insufficient wallet balance',
        required: totalCostNGN,
        available: Number(user.wallet_balance),
      });
    }

    // Place order with ACCSZONE
    const { data: orderResult } = await az.post('/purchase', { ad_id: Number(ad_id), quantity: Number(quantity) });

    // Deduct wallet (NGN)
    await supabase
      .from('users')
      .update({ wallet_balance: Number(user.wallet_balance) - totalCostNGN })
      .eq('id', req.user.id);

    // Save order to Supabase (prices stored in NGN)
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
        total_cost: totalCostNGN,
        status: 'completed',
        delivered_data: orderResult?.accounts || orderResult?.data || orderResult || null,
      })
      .select()
      .single();

    res.json({
      success: true,
      order: savedOrder,
      accounts: orderResult?.accounts || orderResult?.data || [],
      new_balance: Number(user.wallet_balance) - totalCostNGN,
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

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// GET /api/accszone/admin/prices — all listings with auto + custom prices
router.get('/admin/prices', auth, adminOnly, async (req, res) => {
  try {
    const [rate, listings, overrideRows] = await Promise.all([
      getExchangeRate(),
      fetchAllListings(),
      supabase.from('accszone_price_overrides').select('*').then((r) => r.data || []),
    ]);

    const overrideMap = {};
    overrideRows.forEach((r) => { overrideMap[r.slug] = r; });

    const result = listings.map((l) => {
      const slug = l.slug || String(l.id || '');
      const usd = Number(l.price || l.unit_price || 0);
      const autoNGN = parseFloat((usd * rate).toFixed(2));
      const override = overrideMap[slug];
      return {
        slug,
        title: l.title || l.name || slug,
        platform: l._platform || l.platform || '',
        category: l.category?.title || '',
        usd_price: usd,
        auto_price_ngn: autoNGN,
        custom_price_ngn: override ? Number(override.custom_price_ngn) : null,
        has_override: !!override,
        updated_at: override?.updated_at || null,
      };
    });

    res.json({ rate, products: result });
  } catch (err) {
    console.error('[accszone] admin/prices:', err.message);
    res.status(500).json({ error: 'Could not fetch prices' });
  }
});

// PUT /api/accszone/admin/price/:slug — set custom price
router.put('/admin/price/:slug', auth, adminOnly, async (req, res) => {
  const { slug } = req.params;
  const { custom_price_ngn, title } = req.body;
  if (custom_price_ngn == null || isNaN(Number(custom_price_ngn)) || Number(custom_price_ngn) <= 0) {
    return res.status(400).json({ error: 'custom_price_ngn must be a positive number' });
  }
  try {
    const { data, error } = await supabase
      .from('accszone_price_overrides')
      .upsert({ slug, title: title || slug, custom_price_ngn: Number(custom_price_ngn), updated_at: new Date().toISOString() }, { onConflict: 'slug' })
      .select()
      .single();
    if (error) throw error;
    // Bust the overrides cache so next request re-fetches
    cache.delete('_price_overrides');
    res.json(data);
  } catch (err) {
    console.error('[accszone] admin/price PUT:', err.message);
    res.status(500).json({ error: 'Failed to save price override' });
  }
});

// DELETE /api/accszone/admin/price/:slug — remove override (revert to auto)
router.delete('/admin/price/:slug', auth, adminOnly, async (req, res) => {
  const { slug } = req.params;
  try {
    await supabase.from('accszone_price_overrides').delete().eq('slug', slug);
    cache.delete('_price_overrides');
    res.json({ success: true });
  } catch (err) {
    console.error('[accszone] admin/price DELETE:', err.message);
    res.status(500).json({ error: 'Failed to remove override' });
  }
});

module.exports = router;
