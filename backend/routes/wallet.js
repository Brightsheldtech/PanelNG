const express = require('express');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/wallet/balance
router.get('/balance', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ balance: data.wallet_balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// GET /api/wallet/transactions
router.get('/transactions', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ transactions: data, total: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

module.exports = router;
