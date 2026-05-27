const express = require('express');
const supabase = require('../lib/supabase');
const flutterwave = require('../lib/flutterwave');
const auth = require('../middleware/auth');
const { handleFirstDeposit } = require('../lib/referralRewards');
const { notify } = require('../lib/notify');
const router = express.Router();

// ─── FLUTTERWAVE ──────────────────────────────────────────────────────────────

// POST /api/payment/flutterwave/init
// Returns config for the inline SDK — no money moves here yet
router.post('/flutterwave/init', auth, async (req, res) => {
  const { amount } = req.body;
  const naira = parseFloat(amount);

  if (!naira || naira < 100) {
    return res.status(400).json({ error: 'Minimum deposit is ₦100' });
  }
  if (!process.env.FLW_PUBLIC_KEY || !process.env.FLW_SECRET_KEY) {
    return res.status(503).json({ error: 'Payment not configured. Contact support.' });
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', req.user.id)
      .single();

    const txRef = `FLW-PNG-${req.user.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

    res.json({
      public_key: process.env.FLW_PUBLIC_KEY,
      tx_ref: txRef,
      amount: naira,
      customer_email: user.email,
      customer_name: user.full_name || 'Customer',
    });
  } catch (err) {
    console.error('FLW init error:', err.message);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// POST /api/payment/flutterwave/verify
// Called by frontend after inline payment succeeds
router.post('/flutterwave/verify', auth, async (req, res) => {
  const { transaction_id, tx_ref } = req.body;
  if (!transaction_id) return res.status(400).json({ error: 'transaction_id is required' });

  try {
    // Idempotency — don't credit twice
    const { data: existing } = await supabase
      .from('transactions')
      .select('id, amount')
      .eq('reference', String(transaction_id))
      .maybeSingle();

    if (existing) {
      return res.json({ message: 'Already processed', amount: existing.amount, already_processed: true });
    }

    // Verify with Flutterwave
    const result = await flutterwave.verifyById(transaction_id);
    if (!result || result.status !== 'success' || result.data?.status !== 'successful') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    const flwData = result.data;

    // Confirm tx_ref belongs to this user (case-insensitive — Flutterwave may lowercase)
    if (tx_ref && !flwData.tx_ref.toUpperCase().includes(req.user.id.slice(0, 8).toUpperCase())) {
      return res.status(403).json({ error: 'Reference mismatch' });
    }

    const amount = parseFloat(flwData.amount);

    // Credit wallet
    const { data: userRow } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', req.user.id)
      .single();

    const newBalance = parseFloat((parseFloat(userRow.wallet_balance || 0) + amount).toFixed(2));

    await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', req.user.id);

    await supabase.from('transactions').insert({
      user_id: req.user.id,
      type: 'credit',
      amount,
      reference: String(transaction_id),
      description: `Wallet funding via card — ₦${amount.toLocaleString('en-NG')}`,
    });

    // Non-blocking welcome bonus check
    handleFirstDeposit(req.user.id);
    notify(req.user.id, {
      type: 'wallet_credit',
      title: 'Wallet Funded',
      message: `₦${amount.toLocaleString('en-NG')} has been added to your wallet via card payment.`,
    });

    res.json({ message: 'Payment verified. Wallet credited.', amount, new_balance: newBalance });
  } catch (err) {
    console.error('FLW verify error:', err.message);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// POST /api/payment/flutterwave/webhook
// Flutterwave calls this after every completed payment — catches cases where
// the user closed the browser before the frontend verify call completed
router.post('/flutterwave/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const hash = req.headers['verif-hash'];
  if (!process.env.FLW_SECRET_HASH || hash !== process.env.FLW_SECRET_HASH) {
    return res.status(401).end();
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).end();
  }

  if (payload.event !== 'charge.completed' || payload.data?.status !== 'successful') {
    return res.sendStatus(200);
  }

  const flwData = payload.data;
  const transactionId = String(flwData.id);
  const amount = parseFloat(flwData.amount);

  try {
    // Idempotency — skip if already credited
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('reference', transactionId)
      .maybeSingle();

    if (existing) return res.sendStatus(200);

    // Extract user_id from tx_ref: FLW-PNG-{USER_ID_SLICE}-{timestamp}
    const txRef = flwData.tx_ref || '';
    const refParts = txRef.split('-');
    // refParts: ['FLW', 'PNG', '{userId8chars}', '{timestamp}']
    if (refParts.length < 3 || refParts[0] !== 'FLW' || refParts[1] !== 'PNG') {
      return res.sendStatus(200);
    }

    const userIdSlice = refParts[2].toLowerCase();

    // Find user by partial ID match
    const { data: users } = await supabase
      .from('users')
      .select('id, wallet_balance')
      .ilike('id', `${userIdSlice}%`);

    if (!users?.length) return res.sendStatus(200);
    const user = users[0];

    const newBalance = parseFloat((parseFloat(user.wallet_balance || 0) + amount).toFixed(2));
    await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', user.id);
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'credit',
      amount,
      reference: transactionId,
      description: `Wallet funding via card — ₦${amount.toLocaleString('en-NG')}`,
    });

    handleFirstDeposit(user.id);
    notify(user.id, {
      type: 'wallet_credit',
      title: 'Wallet Funded',
      message: `₦${amount.toLocaleString('en-NG')} has been added to your wallet via card payment.`,
    });
    console.log(`[webhook] FLW credited ₦${amount} to user ${user.id.slice(0, 8)}`);
  } catch (err) {
    console.error('[webhook] FLW error:', err.message);
  }

  res.sendStatus(200);
});

// ─── PAYSTACK (commented out — replaced by Flutterwave) ────────────────────
/*
const paystack = require('../lib/paystack');

router.post('/initialize', auth, async (req, res) => { ... });
router.get('/verify/:reference', auth, async (req, res) => { ... });
*/

module.exports = router;
