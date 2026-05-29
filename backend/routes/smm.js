const express = require('express');
const supabase = require('../lib/supabase');
const { getProvider } = require('../lib/providers');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { handleFirstPurchase } = require('../lib/referralRewards');
const { notify } = require('../lib/notify');
const router = express.Router();

// GET /api/smm/services — returns services from our DB (user-facing with sell_price)
router.get('/services', auth, async (req, res) => {
  try {
    const PAGE = 1000;
    let all = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('services')
        .select('id, platform, name, sell_price, min_quantity, max_quantity, panel_service_id, provider')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('platform')
        .order('name')
        .range(from, from + PAGE - 1);
      if (error) throw error;
      all = all.concat(data || []);
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/smm/order — place an SMM order
router.post('/order', auth, async (req, res) => {
  const { service_id, link, quantity } = req.body;
  const userId = req.user.id;

  if (!service_id || !link || !quantity) {
    return res.status(400).json({ error: 'service_id, link, and quantity are required' });
  }

  try {
    const { data: service, error: svcErr } = await supabase
      .from('services')
      .select('*')
      .eq('id', service_id)
      .eq('is_active', true)
      .maybeSingle();

    if (svcErr || !service) return res.status(404).json({ error: 'Service not found or inactive' });

    const qty = parseInt(quantity);
    if (qty < service.min_quantity || qty > service.max_quantity) {
      return res.status(400).json({
        error: `Quantity must be between ${service.min_quantity} and ${service.max_quantity}`,
      });
    }

    // Cost = (sell_price per 1000) * qty / 1000
    const amount = parseFloat(((service.sell_price * qty) / 1000).toFixed(2));
    const apiCost = parseFloat(((service.cost_price * qty) / 1000).toFixed(2));

    // Check wallet
    const { data: userData } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (!userData || userData.wallet_balance < amount) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        required: amount,
        balance: userData?.wallet_balance || 0,
      });
    }

    // Atomic deduct — only succeeds if balance hasn't been reduced by a concurrent request
    const newBalance = parseFloat((userData.wallet_balance - amount).toFixed(2));
    const { data: deducted, error: deductErr } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId)
      .gte('wallet_balance', amount)
      .select('wallet_balance');

    if (deductErr) throw deductErr;
    if (!deducted || deducted.length === 0) {
      return res.status(400).json({ error: 'Insufficient wallet balance', required: amount, balance: userData.wallet_balance });
    }

    // Place order via the correct provider
    const provider = service.provider || 'jap';
    const providerClient = getProvider(provider);
    let panelOrderId = null;
    try {
      const providerRes = await providerClient.placeOrder({
        service: service.panel_service_id,
        link,
        quantity: qty,
      });
      panelOrderId = providerRes.order?.toString() || null;
    } catch (providerErr) {
      // Refund: re-read current balance so any concurrent credits aren't overwritten
      const { data: fresh } = await supabase.from('users').select('wallet_balance').eq('id', userId).single();
      const refundedBalance = parseFloat(((parseFloat(fresh?.wallet_balance) || 0) + amount).toFixed(2));
      await supabase.from('users').update({ wallet_balance: refundedBalance }).eq('id', userId);
      console.error('Provider order error:', providerErr.message);
      return res.status(502).json({ error: 'Order could not be placed at this time. Your wallet has been refunded.' });
    }

    // Create order record
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        type: 'smm',
        platform: service.platform,
        service_name: service.name,
        quantity: qty,
        link,
        amount_paid: amount,
        api_cost: apiCost,
        status: 'pending',
        panel_order_id: panelOrderId,
        provider,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'debit',
      amount,
      reference: `SMM-${order.id}`,
      description: `${service.name} × ${qty.toLocaleString()}`,
    });

    // Non-blocking referral reward check
    handleFirstPurchase(userId);
    notify(userId, {
      type: 'order_placed',
      title: 'SMM Order Placed',
      message: `Your order for "${service.name}" × ${qty.toLocaleString()} has been placed and is being processed.`,
    });

    res.json({ order, message: 'Order placed successfully' });
  } catch (err) {
    console.error('SMM order error:', err.message);
    res.status(500).json({ error: 'Order failed. Try again.' });
  }
});

// GET /api/smm/order/:orderId — check a single order status
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.orderId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error || !order) return res.status(404).json({ error: 'Order not found' });

    // Sync status from provider if pending/processing
    if (order.panel_order_id && ['pending', 'processing', 'in_progress'].includes(order.status)) {
      try {
        const providerClient = getProvider(order.provider || 'jap');
        const providerStatus = await providerClient.getOrderStatus(order.panel_order_id);
        if (providerStatus.status) {
          const newStatus = providerStatus.status.toLowerCase().replace(' ', '_');
          await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
          order.status = newStatus;
          order.remains = providerStatus.remains;
        }
      } catch (_) {}
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// GET /api/smm/balance — panel balance (admin only). ?provider=smmraja to query SMMRaja
router.get('/balance', auth, adminOnly, async (req, res) => {
  try {
    const providerClient = getProvider(req.query.provider || 'jap');
    const balance = await providerClient.getBalance();
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get panel balance' });
  }
});

module.exports = router;
