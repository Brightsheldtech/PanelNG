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

// GET /api/wallet/transactions — unified feed: transactions + bank deposits + accszone orders
router.get('/transactions', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;

  try {
    const userId = req.user.id;

    const [txRes, prRes, azRes] = await Promise.all([
      // Core transactions (SMM debits, SMS debits, card credits, bank confirmations, referral credits)
      supabase
        .from('transactions')
        .select('id, type, amount, description, reference, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),

      // Bank deposit requests — only pending/rejected (confirmed ones are already in transactions)
      supabase
        .from('payment_requests')
        .select('id, amount, reference, status, created_at')
        .eq('user_id', userId)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(limit),

      // Accszone (Buy Accounts) orders
      supabase
        .from('accszone_orders')
        .select('id, product_name, platform, quantity, total_cost, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const txData  = txRes.data  || [];
    const prData  = prRes.data  || [];
    const azData  = azRes.data  || [];

    // Collect references already in transactions so accszone orders don't duplicate
    const txRefs = new Set(txData.map(t => t.reference));

    const unified = [
      ...txData.map(t => ({
        id: t.id,
        type: t.type,        // 'credit' | 'debit'
        amount: Number(t.amount),
        description: t.description,
        reference: t.reference,
        status: 'success',
        created_at: t.created_at,
        source: 'transaction',
      })),

      ...prData.map(p => ({
        id: `PR-${p.id}`,
        type: 'credit',
        amount: Number(p.amount),
        description: `Bank deposit — ${p.reference}`,
        reference: p.reference,
        status: p.status,    // 'pending' | 'rejected'
        created_at: p.created_at,
        source: 'bank_deposit',
      })),

      ...azData
        .filter(a => !txRefs.has(`ACCS-${a.id}`))
        .map(a => ({
          id: `AZ-${a.id}`,
          type: 'debit',
          amount: Number(a.total_cost),
          description: `${a.product_name} × ${a.quantity}`,
          reference: `ACCS-${a.id}`,
          status: a.status,
          created_at: a.created_at,
          source: 'accounts',
        })),
    ];

    unified.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ transactions: unified.slice(0, limit), total: unified.length });
  } catch (err) {
    console.error('[wallet/transactions]:', err.message);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

module.exports = router;
