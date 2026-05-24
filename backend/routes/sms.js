const express = require('express');
const supabase = require('../lib/supabase');
const herosms = require('../lib/herosms');
const auth = require('../middleware/auth');
const { getExchangeRate } = require('../lib/exchangeRate');
const router = express.Router();

// GET /api/sms/balance
router.get('/balance', auth, async (req, res) => {
  try {
    const data = await herosms.getBalance();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get SMS balance' });
  }
});

// GET /api/sms/products — list all available products
router.get('/products', auth, async (req, res) => {
  try {
    const data = await herosms.getProducts();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// GET /api/sms/prices/:product — prices by country for a product (converted to NGN)
router.get('/prices/:product', auth, async (req, res) => {
  try {
    const serviceCode = herosms.toServiceCode(req.params.product);
    const [rawPrices, settingsRes, exchangeRate] = await Promise.all([
      herosms.getPrices(req.params.product),
      supabase.from('sms_country_settings').select('*').eq('service_code', serviceCode),
      getExchangeRate(),
    ]);

    const settings = {};
    (settingsRes.data || []).forEach((s) => { settings[s.country_id] = s; });

    let result = rawPrices
      .filter((p) => !settings[p.countryId]?.is_hidden)
      .map((p) => {
        const s = settings[p.countryId];
        // custom_price is admin-set in USD; raw p.price is also USD — both multiply by rate
        const baseUSD = s?.custom_price != null ? parseFloat(s.custom_price) : p.price;
        return {
          ...p,
          price: parseFloat((baseUSD * exchangeRate).toFixed(2)),
          _sortOrder: s?.sort_order ?? 999,
        };
      });

    result.sort((a, b) => {
      if (a._sortOrder !== b._sortOrder) return a._sortOrder - b._sortOrder;
      if (a.country === 'Nigeria') return -1;
      if (b.country === 'Nigeria') return 1;
      return a.cost - b.cost;
    });

    res.json(result.map(({ _sortOrder, ...rest }) => rest));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get prices' });
  }
});

// POST /api/sms/buy-number
router.post('/buy-number', auth, async (req, res) => {
  const { product, country } = req.body; // price from client is ignored — computed server-side
  const userId = req.user.id;

  if (!product || !country) {
    return res.status(400).json({ error: 'product and country are required' });
  }

  try {
    // Compute the authoritative NGN cost server-side
    const serviceCode = herosms.toServiceCode(product);
    const [rawPrices, settingsRes, exchangeRate] = await Promise.all([
      herosms.getPrices(product),
      supabase.from('sms_country_settings').select('*').eq('service_code', serviceCode),
      getExchangeRate(),
    ]);

    const settings = {};
    (settingsRes.data || []).forEach((s) => { settings[s.country_id] = s; });

    const countryEntry = rawPrices.find(
      (p) => p.countryId === parseInt(country) || p.country.toLowerCase() === String(country).toLowerCase()
    );
    if (!countryEntry) return res.status(400).json({ error: 'Country not available for this service' });

    const s = settings[countryEntry.countryId];
    const baseUSD = s?.custom_price != null ? parseFloat(s.custom_price) : countryEntry.price;
    const cost = parseFloat((baseUSD * exchangeRate).toFixed(2));

    const { data: userData } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (!userData || userData.wallet_balance < cost) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        required: cost,
        balance: userData?.wallet_balance || 0,
      });
    }

    // Buy from HeroSMS
    const numberData = await herosms.buyNumber(product, country);

    if (!numberData || !numberData.orderId) {
      return res.status(502).json({ error: 'No numbers available right now. Try again.' });
    }

    // Deduct wallet — number is now purchased on HeroSMS side
    const newBalance = parseFloat((userData.wallet_balance - cost).toFixed(2));
    await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);

    // Create SMS order record
    const { data: smsOrder, error: insertErr } = await supabase
      .from('sms_orders')
      .insert({
        user_id: userId,
        platform: product,
        country: country,
        phone_number: numberData.number,
        order_id: numberData.orderId.toString(),
        status: 'pending',
        amount_paid: cost,
      })
      .select()
      .single();

    if (insertErr) {
      // Wallet was debited but we couldn't record the order — refund immediately
      console.error('sms_orders insert failed, refunding wallet:', insertErr.message);
      await supabase.from('users').update({ wallet_balance: userData.wallet_balance }).eq('id', userId);
      try { await herosms.cancelOrder(numberData.orderId); } catch (_) {}
      return res.status(500).json({ error: 'Order recording failed. Your wallet has been refunded.' });
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'debit',
      amount: cost,
      reference: `SMS-${smsOrder.id}`,
      description: `SMS number — ${product} (${country})`,
    });

    res.json({
      smsOrder,
      number: numberData.number,
      orderId: numberData.orderId,
    });
  } catch (err) {
    console.error('Buy number error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to buy number. Try again.' });
  }
});

// GET /api/sms/check/:orderId — poll for SMS code
router.get('/check/:orderId', auth, async (req, res) => {
  try {
    const result = await herosms.checkOrder(req.params.orderId);

    if (result.smsCode) {
      await supabase
        .from('sms_orders')
        .update({ status: 'completed' })
        .eq('order_id', req.params.orderId)
        .eq('user_id', req.user.id);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check order' });
  }
});

// POST /api/sms/finish/:orderId
router.post('/finish/:orderId', auth, async (req, res) => {
  try {
    const result = await herosms.finishOrder(req.params.orderId);
    await supabase
      .from('sms_orders')
      .update({ status: 'finished' })
      .eq('order_id', req.params.orderId)
      .eq('user_id', req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to finish order' });
  }
});

// POST /api/sms/cancel/:orderId
router.post('/cancel/:orderId', auth, async (req, res) => {
  try {
    const result = await herosms.cancelOrder(req.params.orderId);
    await supabase
      .from('sms_orders')
      .update({ status: 'cancelled' })
      .eq('order_id', req.params.orderId)
      .eq('user_id', req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// GET /api/sms/orders — user's SMS order history
router.get('/orders', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sms_orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get SMS orders' });
  }
});

module.exports = router;
