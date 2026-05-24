const express = require('express');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/orders — user's order history (smm + sms combined)
router.get('/', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const offset = parseInt(req.query.offset) || 0;
  const type = req.query.type; // 'smm' | 'sms' | undefined/all

  try {
    const userId = req.user.id;

    const fetchSmm = !type || type === 'all' || type === 'smm';
    const fetchSms = !type || type === 'all' || type === 'sms';

    const [smmRes, smsRes] = await Promise.all([
      fetchSmm
        ? supabase.from('orders').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], count: 0, error: null }),
      fetchSms
        ? supabase.from('sms_orders').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], count: 0, error: null }),
    ]);

    if (smmRes.error) throw smmRes.error;
    if (smsRes.error) throw smsRes.error;

    // Normalize SMS orders to share shape with SMM orders
    const smmOrders = (smmRes.data || []).map((o) => ({ ...o, type: o.type || 'smm' }));
    const smsOrders = (smsRes.data || []).map((o) => ({
      id: o.id,
      type: 'sms',
      platform: o.platform,
      service_name: o.phone_number,
      country: o.country,
      phone_number: o.phone_number,
      sms_code: o.sms_code,
      quantity: null,
      link: null,
      amount_paid: o.amount_paid,
      status: o.status,
      created_at: o.created_at,
    }));

    // Merge and sort by created_at descending, then paginate
    const merged = [...smmOrders, ...smsOrders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const total = (smmRes.count || 0) + (smsRes.count || 0);
    const paginated = merged.slice(offset, offset + limit);

    res.json({ orders: paginated, total });
  } catch (err) {
    console.error('Orders fetch error:', err.message);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

module.exports = router;
