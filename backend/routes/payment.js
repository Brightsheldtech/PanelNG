const express = require('express');
const supabase = require('../lib/supabase');
const paystack = require('../lib/paystack');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/payment/initialize
router.post('/initialize', auth, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  const naira = parseFloat(amount);
  if (!naira || naira < 100) {
    return res.status(400).json({ error: 'Minimum funding amount is ₦100' });
  }

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const reference = `PNG-${userId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const callback_url = `${process.env.FRONTEND_URL}/payment/callback`;

    const result = await paystack.initializeTransaction({
      email: userData.email,
      amount: naira,
      reference,
      callback_url,
      metadata: { user_id: userId, full_name: userData.full_name },
    });

    if (!result.status) {
      return res.status(400).json({ error: 'Failed to initialize payment with Paystack' });
    }

    // Record pending transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'credit',
      amount: naira,
      reference,
      description: `Wallet funding — ₦${naira.toLocaleString('en-NG')}`,
    });

    res.json({
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference,
    });
  } catch (err) {
    console.error('Payment init error:', err.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// GET /api/payment/verify/:reference
router.get('/verify/:reference', auth, async (req, res) => {
  const { reference } = req.params;
  const userId = req.user.id;

  try {
    // Check idempotency — don't credit twice
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, description, amount')
      .eq('reference', reference)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingTx?.description?.includes('(Confirmed)')) {
      return res.json({
        message: 'Payment already confirmed',
        amount: existingTx.amount,
        already_processed: true,
      });
    }

    const verification = await paystack.verifyTransaction(reference);

    if (!verification.status || verification.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment not successful or still pending' });
    }

    const amount = verification.data.amount / 100; // kobo → naira

    // Credit wallet
    const { data: userData } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    const newBalance = parseFloat((userData.wallet_balance + amount).toFixed(2));
    await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', userId);

    // Mark transaction as confirmed
    await supabase
      .from('transactions')
      .update({ description: `Wallet funding — ₦${amount.toLocaleString('en-NG')} (Confirmed)` })
      .eq('reference', reference)
      .eq('user_id', userId);

    res.json({
      message: 'Payment verified. Wallet credited.',
      amount,
      new_balance: newBalance,
    });
  } catch (err) {
    console.error('Payment verify error:', err.message);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

module.exports = router;
