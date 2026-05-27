const express = require('express');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/referral/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('referral_code, referral_count, referral_balance')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;

    const { data: referred } = await supabase
      .from('users')
      .select('full_name, created_at')
      .eq('referred_by', user.referral_code)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({
      referral_code: user.referral_code,
      referral_count: Number(user.referral_count || 0),
      referral_balance: Number(user.referral_balance || 0),
      referred_users: referred || [],
    });
  } catch (err) {
    console.error('[referral/stats]:', err.message);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

// POST /api/referral/withdraw — move referral balance to wallet
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, referral_balance, wallet_balance')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;

    const amount = Number(user.referral_balance || 0);
    if (amount <= 0) return res.status(400).json({ error: 'No referral earnings to withdraw' });

    const { error: updErr } = await supabase
      .from('users')
      .update({
        referral_balance: 0,
        wallet_balance: Number(user.wallet_balance) + amount,
      })
      .eq('id', req.user.id);
    if (updErr) throw updErr;

    // Record in transaction history
    await supabase.from('transactions').insert({
      user_id: req.user.id,
      type: 'credit',
      amount,
      reference: `REF-WITHDRAW-${Date.now()}`,
      description: `Referral earnings withdrawal — ₦${amount.toFixed(2)}`,
    });

    res.json({ message: `₦${amount.toFixed(2)} transferred to your wallet`, amount });
  } catch (err) {
    console.error('[referral/withdraw]:', err.message);
    res.status(500).json({ error: 'Withdrawal failed. Try again.' });
  }
});

module.exports = router;
