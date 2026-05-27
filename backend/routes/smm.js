const express = require('express');
const supabase = require('../lib/supabase');
const jap = require('../lib/jap');
const auth = require('../middleware/auth');
const { handleFirstPurchase } = require('../lib/referralRewards');
const { notify } = require('../lib/notify');
const router = express.Router();

// GET /api/smm/services — returns services from our DB (user-facing with sell_price)
router.get('/services', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, platform, name, sell_price, min_quantity, max_quantity, panel_service_id')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('platform')
      .order('name');

    if (error) throw error;
    res.json(data);
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

    // Deduct from wallet immediately
    const { error: deductErr } = await supabase
      .from('users')
      .update({ wallet_balance: parseFloat((userData.wallet_balance - amount).toFixed(2)) })
      .eq('id', userId);

    if (deductErr) throw deductErr;

    // Place on JAP
    let panelOrderId = null;
    try {
      const japRes = await jap.placeOrder({
        service: service.panel_service_id,
        link,
        quantity: qty,
      });
      panelOrderId = japRes.order?.toString() || null;
    } catch (japErr) {
      // Refund wallet on JAP failure
      await supabase
        .from('users')
        .update({ wallet_balance: parseFloat((userData.wallet_balance).toFixed(2)) })
        .eq('id', userId);
      console.error('JAP order error:', japErr.message);
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
        status: 'pending',
        panel_order_id: panelOrderId,
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

    // Sync status from JAP if pending/processing
    if (order.panel_order_id && ['pending', 'processing', 'in_progress'].includes(order.status)) {
      try {
        const japStatus = await jap.getOrderStatus(order.panel_order_id);
        if (japStatus.status) {
          const newStatus = japStatus.status.toLowerCase().replace(' ', '_');
          await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
          order.status = newStatus;
          order.remains = japStatus.remains;
        }
      } catch (_) {}
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// GET /api/smm/balance — JAP panel balance (admin info)
router.get('/balance', auth, async (req, res) => {
  try {
    const balance = await jap.getBalance();
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get panel balance' });
  }
});

module.exports = router;
