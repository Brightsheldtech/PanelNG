const express = require('express');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/wallet/balance
router.get('/balance', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('wallet_balance, total_funded, total_spent')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ balance: data.wallet_balance, total_funded: data.total_funded, total_spent: data.total_spent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// GET /api/wallet/transactions — unified feed: transactions + bank deposits + accszone orders
router.get('/transactions', auth, async (req, res) => {
  const limit  = parseInt(req.query.limit)  || 30;
  const offset = parseInt(req.query.offset) || 0;
  // Fetch enough rows from each source to cover offset + limit after merge
  const fetchSize = limit + offset;

  try {
    const userId = req.user.id;

    const [txRes, prRes, azRes] = await Promise.all([
      // Core transactions (SMM debits, SMS debits, card credits, bank confirmations, referral credits)
      supabase
        .from('transactions')
        .select('id, type, amount, description, reference, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(fetchSize),

      // Bank deposit requests — only pending/rejected (confirmed ones are already in transactions)
      supabase
        .from('payment_requests')
        .select('id, amount, reference, status, created_at')
        .eq('user_id', userId)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(fetchSize),

      // Accszone (Buy Accounts) orders
      supabase
        .from('accszone_orders')
        .select('id, product_name, platform, quantity, total_cost, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(fetchSize),
    ]);

    if (txRes.error) console.error('[wallet/tx] transactions error:', txRes.error.message);
    if (prRes.error) console.error('[wallet/tx] payment_requests error:', prRes.error.message);
    if (azRes.error) console.error('[wallet/tx] accszone_orders error:', azRes.error.message);

    const txData  = txRes.data  || [];
    const prData  = prRes.data  || [];
    const azData  = azRes.data  || [];

    console.log(`[wallet/tx] user=${userId.slice(0,8)} tx=${txData.length} pr=${prData.length} az=${azData.length}`);

    // Collect references already in transactions so accszone orders don't duplicate
    const txRefs = new Set(txData.map(t => t.reference));

    const unified = [
      ...txData.map(t => ({
        id: t.id,
        type: t.type,        // 'credit' | 'debit'
        amount: Number(t.amount),
        description: t.description,
        reference: t.reference,
        status: (t.status && t.status !== 'completed') ? t.status : 'success',
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

    res.json({ transactions: unified.slice(offset, offset + limit), total: unified.length });
  } catch (err) {
    console.error('[wallet/transactions]:', err.message);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

router.get('/virtual-account', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_virtual_accounts')
      .select('account_number, account_name, bank_name, created_at')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (error) {
      console.error('[VA GET] DB error:', error.message, error.code);
      return res.status(500).json({ error: 'Failed to fetch virtual account' });
    }
    res.json(data || null);
  } catch (err) {
    console.error('[VA GET] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch virtual account' });
  }
});

router.post('/virtual-account', auth, async (req, res) => {
  try {
    // Check DB first
    const { data: existing, error: fetchErr } = await supabase
      .from('user_virtual_accounts')
      .select('account_number, account_name, bank_name')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (fetchErr) console.error('[VA POST] fetch existing error:', fetchErr.message, fetchErr.code);
    if (existing) return res.json(existing);

    const { bvn } = req.body;
    if (!bvn || !/^\d{11}$/.test(bvn)) {
      return res.status(400).json({ error: 'A valid 11-digit BVN or NIN is required.' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('email, full_name, phone')
      .eq('id', req.user.id)
      .single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!process.env.FLW_SECRET_KEY) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    const flutterwave = require('../lib/flutterwave');
    const nameParts = (user.full_name || 'Customer').split(' ');
    const hex = req.user.id.replace(/-/g, '').toUpperCase();
    const txRef = `VA-PNG-${hex}`;

    const result = await flutterwave.createVirtualAccount({
      email: user.email,
      txRef,
      bvn,
      firstname: nameParts[0],
      lastname: nameParts.slice(1).join(' ') || 'Customer',
      phonenumber: user.phone || '08000000000',
      narration: `PanelNG | ${user.full_name || user.email}`,
    });

    if (!result || result.status !== 'success') {
      console.error('[VA POST] Flutterwave error:', result?.message);
      return res.status(400).json({ error: result?.message || 'Virtual account creation failed' });
    }

    const va = result.data;

    // Upsert — handles retry when Flutterwave already has the account but DB doesn't
    const { error: upsertErr } = await supabase
      .from('user_virtual_accounts')
      .upsert({
        user_id: req.user.id,
        account_number: va.account_number,
        account_name: va.account_name || null,
        bank_name: va.bank_name || 'Wema Bank',
        flw_order_ref: va.order_ref || null,
      }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('[VA POST] DB upsert failed:', upsertErr.message, upsertErr.code);
      // VA exists in Flutterwave — return data but surface the DB error in logs
      return res.status(500).json({
        error: `Virtual account created but failed to save (${upsertErr.code}). Run the virtual_accounts migration in Supabase and try again.`,
      });
    }

    res.status(201).json({
      account_number: va.account_number,
      account_name: va.account_name,
      bank_name: va.bank_name,
    });
  } catch (err) {
    console.error('VA create error:', err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to generate virtual account' });
  }
});

module.exports = router;
