const express = require('express');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const { sendPaymentNotification } = require('../lib/mailer');
const router = express.Router();

// GET /api/bank/details — active bank accounts (shown to customers)
router.get('/details', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bank_details')
      .select('id, bank_name, account_number, account_name')
      .eq('is_active', true)
      .order('bank_name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('bank/details error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bank details' });
  }
});

// POST /api/bank/request — customer confirms they've sent payment
router.post('/request', auth, async (req, res) => {
  const { amount, reference } = req.body;
  const parsedAmount = parseFloat(amount);

  if (!parsedAmount || parsedAmount < 1000) {
    return res.status(400).json({ error: 'Minimum deposit is ₦1,000' });
  }
  if (!reference || !/^PNG-\d{4}-[A-Z]{1,4}$/.test(reference)) {
    return res.status(400).json({ error: 'Invalid reference format' });
  }

  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', req.user.id)
      .single();
    if (userErr || !user) return res.status(404).json({ error: 'User not found' });

    // Check reference not already used
    const { data: existing } = await supabase
      .from('payment_requests')
      .select('id')
      .eq('reference', reference)
      .single();
    if (existing) return res.status(409).json({ error: 'Reference already used — please generate a new one' });

    const { data: request, error } = await supabase
      .from('payment_requests')
      .insert({ user_id: user.id, amount: parsedAmount, reference, status: 'pending' })
      .select()
      .single();
    if (error) throw error;

    // Email admin (non-blocking)
    sendPaymentNotification({
      fullName: user.full_name,
      email: user.email,
      amount: parsedAmount,
      reference,
      createdAt: request.created_at,
    });

    res.status(201).json({ request });
  } catch (err) {
    console.error('Bank request error:', err.message);
    res.status(500).json({ error: 'Failed to submit payment request' });
  }
});

// GET /api/bank/my-requests — customer's own request history
router.get('/my-requests', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data || []);
  } catch {
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});

module.exports = router;
