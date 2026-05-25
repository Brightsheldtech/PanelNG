const express = require('express');
const supabase = require('../lib/supabase');
const jap = require('../lib/jap');
const herosms = require('../lib/herosms');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { sendPaymentConfirmed, sendPaymentRejected } = require('../lib/mailer');
const router = express.Router();

router.use(auth, adminOnly);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, wallet_balance, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// GET /api/admin/orders — SMM + SMS combined
router.get('/orders', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const type = req.query.type; // 'smm' | 'sms' | undefined = all

  const fetchSmm = !type || type === 'smm';
  const fetchSms = !type || type === 'sms';

  try {
    const [smmRes, smsRes] = await Promise.all([
      fetchSmm
        ? supabase.from('orders').select('*, users(email, full_name)', { count: 'exact' }).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], count: 0, error: null }),
      fetchSms
        ? supabase.from('sms_orders').select('*, users(email, full_name)', { count: 'exact' }).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], count: 0, error: null }),
    ]);

    if (smmRes.error) throw smmRes.error;
    if (smsRes.error) throw smsRes.error;

    const smmOrders = (smmRes.data || []).map((o) => ({ ...o, type: 'smm' }));
    const smsOrders = (smsRes.data || []).map((o) => ({
      id: o.id,
      type: 'sms',
      platform: o.platform,
      service_name: o.phone_number,
      phone_number: o.phone_number,
      country: o.country,
      sms_code: o.sms_code,
      quantity: null,
      link: null,
      amount_paid: o.amount_paid,
      status: o.status,
      created_at: o.created_at,
      users: o.users,
    }));

    const merged = [...smmOrders, ...smsOrders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = (smmRes.count || 0) + (smsRes.count || 0);
    const paginated = merged.slice(offset, offset + limit);

    res.json({ orders: paginated, total });
  } catch (err) {
    console.error('Admin orders error:', err.message);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*, users(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ transactions: data, total: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// GET /api/admin/services — all services (including inactive)
router.get('/services', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('platform')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// PATCH /api/admin/services — update service pricing/status
router.patch('/services', async (req, res) => {
  const { id, sell_price, is_active, min_quantity, max_quantity, sort_order } = req.body;
  if (!id) return res.status(400).json({ error: 'Service id is required' });

  const updates = {};
  if (sell_price !== undefined) updates.sell_price = parseFloat(sell_price);
  if (is_active !== undefined) updates.is_active = Boolean(is_active);
  if (min_quantity !== undefined) updates.min_quantity = parseInt(min_quantity);
  if (max_quantity !== undefined) updates.max_quantity = parseInt(max_quantity);
  if (sort_order !== undefined) updates.sort_order = parseInt(sort_order);

  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// POST /api/admin/services — create a new service manually
router.post('/services', async (req, res) => {
  const { platform, name, panel_service_id, cost_price, sell_price, min_quantity, max_quantity } = req.body;
  if (!platform || !name || !panel_service_id || !sell_price) {
    return res.status(400).json({ error: 'platform, name, panel_service_id, and sell_price are required' });
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .insert({
        platform,
        name,
        panel_service_id: panel_service_id.toString(),
        cost_price: parseFloat(cost_price) || 0,
        sell_price: parseFloat(sell_price),
        min_quantity: parseInt(min_quantity) || 100,
        max_quantity: parseInt(max_quantity) || 10000,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// POST /api/admin/sync-services — import from JAP and upsert into DB
router.post('/sync-services', async (req, res) => {
  try {
    const japServices = await jap.getServices();
    if (!Array.isArray(japServices)) {
      return res.status(502).json({ error: 'JAP returned unexpected data' });
    }

    let synced = 0;
    const MARKUP = 1.3; // 30% default markup

    for (const svc of japServices) {
      const { error } = await supabase.from('services').upsert(
        {
          panel_service_id: svc.service.toString(),
          platform: svc.category || 'Other',
          name: svc.name,
          cost_price: parseFloat(svc.rate) || 0,
          sell_price: parseFloat((parseFloat(svc.rate) * MARKUP).toFixed(4)),
          min_quantity: parseInt(svc.min) || 10,
          max_quantity: parseInt(svc.max) || 100000,
          is_active: true,
        },
        { onConflict: 'panel_service_id' }
      );
      if (!error) synced++;
    }

    res.json({ synced, total: japServices.length });
  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync services from JAP' });
  }
});

// ============================================================
// PAYMENT REQUESTS
// ============================================================

// GET /api/admin/payment-requests
router.get('/payment-requests', async (req, res) => {
  const { status } = req.query;
  try {
    let query = supabase
      .from('payment_requests')
      .select('*, users(email, full_name)')
      .order('created_at', { ascending: false });
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch payment requests' });
  }
});

// PATCH /api/admin/payment-requests/:id/confirm
router.patch('/payment-requests/:id/confirm', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: pr, error: prErr } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', id)
      .single();
    if (prErr || !pr) return res.status(404).json({ error: 'Request not found' });
    if (pr.status === 'confirmed') return res.status(400).json({ error: 'Already confirmed' });

    // Check if transaction already exists for this reference (wallet already credited)
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('reference', pr.reference)
      .maybeSingle();

    const alreadyCredited = !!existingTx;

    if (!alreadyCredited) {
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('wallet_balance, email, full_name')
        .eq('id', pr.user_id)
        .single();
      if (userErr) throw userErr;

      const newBalance = parseFloat(userRow.wallet_balance || 0) + parseFloat(pr.amount);

      const { error: walletErr } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', pr.user_id);
      if (walletErr) throw walletErr;

      const { error: txErr } = await supabase.from('transactions').insert({
        user_id: pr.user_id,
        type: 'credit',
        amount: pr.amount,
        reference: pr.reference,
        description: `Bank deposit confirmed — ${pr.reference}`,
      });
      if (txErr) throw txErr;

      // Notify user their wallet has been credited (non-blocking)
      sendPaymentConfirmed({
        toEmail: userRow.email,
        toName: userRow.full_name,
        amount: pr.amount,
        reference: pr.reference,
        confirmedAt: new Date().toISOString(),
      });
    }

    // Mark confirmed — try with optional columns first, fall back if they don't exist yet
    const { data: updated, error: updateErr } = await supabase
      .from('payment_requests')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: req.user.id })
      .eq('id', id)
      .select()
      .single();

    if (updateErr && updateErr.code === 'PGRST204') {
      const { data: u2, error: e2 } = await supabase
        .from('payment_requests')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (e2) throw e2;
      return res.json({ success: true, request: u2 });
    }
    if (updateErr) throw updateErr;

    res.json({ success: true, request: updated });
  } catch (err) {
    console.error('Confirm payment error:', err.message);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// PATCH /api/admin/payment-requests/:id/reject
router.patch('/payment-requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const { data: pr, error: prErr } = await supabase
      .from('payment_requests')
      .select('id, status, amount, reference, user_id')
      .eq('id', id)
      .single();
    if (prErr || !pr) return res.status(404).json({ error: 'Request not found' });
    if (pr.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    const rejectUpdate = { status: 'rejected' };

    const { data: updated, error } = await supabase
      .from('payment_requests')
      .update({ ...rejectUpdate, reject_reason: reason || null })
      .eq('id', id)
      .select()
      .single();

    if (error && error.code === 'PGRST204') {
      // reject_reason column missing — update without it
      const { data: u2, error: e2 } = await supabase
        .from('payment_requests')
        .update(rejectUpdate)
        .eq('id', id)
        .select()
        .single();
      if (e2) throw e2;

      // Notify user (non-blocking)
      supabase.from('users').select('email, full_name').eq('id', pr.user_id).single()
        .then(({ data: usr }) => {
          if (usr) sendPaymentRejected({ toEmail: usr.email, toName: usr.full_name, amount: pr.amount, reference: pr.reference, reason });
        });

      return res.json({ success: true, request: u2 });
    }
    if (error) throw error;

    // Notify user (non-blocking)
    supabase.from('users').select('email, full_name').eq('id', pr.user_id).single()
      .then(({ data: usr }) => {
        if (usr) sendPaymentRejected({ toEmail: usr.email, toName: usr.full_name, amount: pr.amount, reference: pr.reference, reason });
      });

    res.json({ success: true, request: updated });
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ============================================================
// BANK DETAILS
// ============================================================

// GET /api/admin/bank-details
router.get('/bank-details', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bank_details')
      .select('*')
      .order('bank_name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('bank-details GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bank details' });
  }
});

// POST /api/admin/bank-details
router.post('/bank-details', async (req, res) => {
  const { bank_name, account_number, account_name } = req.body;
  if (!bank_name || !account_number || !account_name) {
    return res.status(400).json({ error: 'bank_name, account_number, and account_name are required' });
  }
  try {
    const { data, error } = await supabase
      .from('bank_details')
      .insert({ bank_name, account_number, account_name, is_active: true })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to add bank account' });
  }
});

// PATCH /api/admin/bank-details/:id
router.patch('/bank-details/:id', async (req, res) => {
  const { id } = req.params;
  const { bank_name, account_number, account_name, is_active } = req.body;
  const updates = {};
  if (bank_name !== undefined) updates.bank_name = bank_name;
  if (account_number !== undefined) updates.account_number = account_number;
  if (account_name !== undefined) updates.account_name = account_name;
  if (is_active !== undefined) updates.is_active = Boolean(is_active);
  try {
    const { data, error } = await supabase
      .from('bank_details')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to update bank account' });
  }
});

// DELETE /api/admin/bank-details/:id
router.delete('/bank-details/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('bank_details').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

// ============================================================
// APP SETTINGS (admin email, gmail routing)
// ============================================================

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (error) throw error;
    const settings = {};
    (data || []).forEach((s) => { settings[s.key] = s.value; });
    res.json(settings);
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PATCH /api/admin/settings
router.patch('/settings', async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) return res.status(400).json({ error: 'key and value are required' });
  const ALLOWED = ['admin_email', 'gmail_user', 'usd_ngn_rate'];
  if (!ALLOWED.includes(key)) return res.status(400).json({ error: 'Unknown settings key' });
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

// GET /api/admin/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [usersRes, ordersRes, smsRes, txRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).neq('role', 'admin'),
      supabase.from('orders').select('id', { count: 'exact' }),
      supabase.from('sms_orders').select('id, amount_paid', { count: 'exact' }),
      supabase.from('transactions').select('amount').eq('type', 'credit'),
    ]);

    const totalRevenue = (txRes.data || []).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const smsRevenue = (smsRes.data || []).reduce((sum, o) => sum + parseFloat(o.amount_paid || 0), 0);

    res.json({
      total_users: usersRes.count || 0,
      total_orders: ordersRes.count || 0,
      sms_orders: smsRes.count || 0,
      total_revenue: totalRevenue,
      sms_revenue: smsRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================
// SMS ORDERS (admin view)
// ============================================================

router.get('/sms-orders', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  try {
    const { data, error, count } = await supabase
      .from('sms_orders')
      .select('*, users(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    res.json({ orders: data, total: count });
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to get SMS orders' });
  }
});

// ============================================================
// SMS COUNTRY SETTINGS
// ============================================================

// GET /api/admin/sms-all-services — full list of every service HeroSMS offers
router.get('/sms-all-services', async (req, res) => {
  try {
    const services = await herosms.getAllServices();
    res.json(services);
  } catch (err) {
    console.error('sms-all-services error:', err.message);
    res.status(500).json({ error: 'Failed to fetch service list from HeroSMS' });
  }
});

// GET /api/admin/sms-prices/:product — raw HeroSMS prices merged with settings
router.get('/sms-prices/:product', async (req, res) => {
  try {
    const serviceCode = herosms.toServiceCode(req.params.product);
    const [rawPrices, settingsRes] = await Promise.all([
      herosms.getPrices(req.params.product),
      supabase.from('sms_country_settings').select('*').eq('service_code', serviceCode),
    ]);

    const settings = {};
    (settingsRes.data || []).forEach((s) => { settings[s.country_id] = s; });

    const result = rawPrices.map((p) => {
      const s = settings[p.countryId];
      return {
        ...p,
        setting_id: s?.id || null,
        is_hidden: s?.is_hidden || false,
        sort_order: s?.sort_order ?? 999,
        custom_price: s?.custom_price ?? null,
      };
    });

    res.json({ serviceCode, countries: result });
  } catch (err) {
    console.error('Admin sms-prices error:', err.message);
    res.status(500).json({ error: 'Failed to get SMS prices' });
  }
});

// PUT /api/admin/sms-country-settings — upsert a country setting
router.put('/sms-country-settings', async (req, res) => {
  const { service_code, country_id, country_name, is_hidden, sort_order, custom_price } = req.body;
  if (!service_code || country_id === undefined) {
    return res.status(400).json({ error: 'service_code and country_id are required' });
  }
  const upsertData = {
    service_code,
    country_id: parseInt(country_id),
    country_name: country_name || '',
    is_hidden: Boolean(is_hidden),
    sort_order: parseInt(sort_order) || 999,
    custom_price: custom_price !== null && custom_price !== undefined && custom_price !== '' ? parseFloat(custom_price) : null,
  };
  try {
    const { data, error } = await supabase
      .from('sms_country_settings')
      .upsert(upsertData, { onConflict: 'service_code,country_id' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Upsert country setting error:', err.message);
    res.status(500).json({ error: 'Failed to save country setting' });
  }
});

// DELETE /api/admin/sms-country-settings/:id — reset a country to defaults
router.delete('/sms-country-settings/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('sms_country_settings').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { console.error(err.message);
    res.status(500).json({ error: 'Failed to delete country setting' });
  }
});

// ============================================================
// SUPPORT / LIVE CHAT
// ============================================================

// GET /api/admin/support — list conversations (open + resolved, not bot-phase)
router.get('/support', async (req, res) => {
  const { status } = req.query;
  try {
    let query = supabase
      .from('support_conversations')
      .select('id, status, subject, created_at, updated_at, users(id, full_name, email)')
      .order('updated_at', { ascending: false });
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['open', 'resolved']);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('admin/support GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/admin/support/:id — conversation + full message thread
router.get('/support/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [convRes, msgRes] = await Promise.all([
      supabase
        .from('support_conversations')
        .select('id, status, subject, created_at, updated_at, users(id, full_name, email)')
        .eq('id', id)
        .single(),
      supabase
        .from('support_messages')
        .select('id, sender_type, body, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(200),
    ]);
    if (convRes.error) throw convRes.error;
    res.json({ conversation: convRes.data, messages: msgRes.data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// POST /api/admin/support/:id/reply — admin sends a reply
router.post('/support/:id/reply', async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Message is required' });
  try {
    const { data, error } = await supabase
      .from('support_messages')
      .insert({ conversation_id: id, sender_type: 'admin', sender_id: req.user.id, body: body.trim() })
      .select('id, sender_type, body, created_at')
      .single();
    if (error) throw error;
    await supabase
      .from('support_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// PATCH /api/admin/support/:id/resolve — mark conversation as resolved
router.patch('/support/:id/resolve', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('support_conversations')
      .update({ status: 'resolved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve conversation' });
  }
});

// PATCH /api/admin/support/:id/reopen — reopen a resolved conversation
router.patch('/support/:id/reopen', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('support_conversations')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reopen conversation' });
  }
});

module.exports = router;
