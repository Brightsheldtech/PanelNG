const supabase = require('./supabase');

const REFERRER_REWARD = 500; // ₦500 credited to referrer's referral_balance
const REFEREE_BONUS   = 200; // ₦200 welcome bonus to referee's wallet

// Called after a purchase order is successfully inserted.
// Unlocks the referrer's ₦500 if this is the referee's first purchase.
async function handleFirstPurchase(userId) {
  try {
    const [{ count: smmCount }, { count: smsCount }] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('sms_orders').select('id', { count: 'exact' }).eq('user_id', userId),
    ]);
    if (((smmCount || 0) + (smsCount || 0)) !== 1) return; // Not first purchase

    const { data: referral } = await supabase
      .from('referrals')
      .select('id, referrer_id, reward_tx_id')
      .eq('referee_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    if (!referral) return;

    // Mark referral completed
    await supabase.from('referrals').update({ status: 'completed' }).eq('id', referral.id);

    // Credit referrer's referral_balance
    const { data: referrer } = await supabase
      .from('users').select('referral_balance').eq('id', referral.referrer_id).single();
    await supabase.from('users')
      .update({ referral_balance: parseFloat((parseFloat(referrer?.referral_balance || 0) + REFERRER_REWARD).toFixed(2)) })
      .eq('id', referral.referrer_id);

    // Flip pending transaction to completed
    if (referral.reward_tx_id) {
      await supabase.from('transactions')
        .update({ status: 'completed', description: 'Referral reward — ₦500 (referee made first purchase)' })
        .eq('id', referral.reward_tx_id);
    }
  } catch (err) {
    console.error('[referralRewards] handleFirstPurchase:', err.message);
  }
}

// Called after a user's wallet is credited from a real deposit.
// Gives the referred user ₦200 welcome bonus on their first deposit.
async function handleFirstDeposit(userId) {
  try {
    // Only count real user-initiated deposits (exclude admin adjustments, bonuses, refunds)
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('type', 'credit')
      .not('reference', 'like', 'ADJ-%')
      .not('reference', 'like', 'REF-%')
      .not('reference', 'like', 'WELCOME-%')
      .not('reference', 'like', 'REFUND-%');

    if ((count || 0) !== 1) return; // Not first deposit

    const { data: referral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', userId)
      .eq('referee_bonus_paid', false)
      .maybeSingle();
    if (!referral) return;

    // Mark bonus paid
    await supabase.from('referrals').update({ referee_bonus_paid: true }).eq('id', referral.id);

    // Credit ₦200 to user's wallet
    const { data: userRow } = await supabase
      .from('users').select('wallet_balance').eq('id', userId).single();
    const newBalance = parseFloat((parseFloat(userRow?.wallet_balance || 0) + REFEREE_BONUS).toFixed(2));
    await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', userId);

    // Record the bonus transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'credit',
      amount: REFEREE_BONUS,
      reference: `WELCOME-${Date.now()}-${userId.slice(0, 6).toUpperCase()}`,
      description: '₦200 welcome bonus — thank you for your first deposit!',
      status: 'completed',
    });
  } catch (err) {
    console.error('[referralRewards] handleFirstDeposit:', err.message);
  }
}

module.exports = { handleFirstPurchase, handleFirstDeposit };
