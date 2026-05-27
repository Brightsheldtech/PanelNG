const supabase = require('./supabase');

/**
 * Insert a notification for a user. Fire-and-forget — never throws.
 * @param {string} userId
 * @param {{ type: string, title: string, message: string }} opts
 * Types: wallet_credit | order_placed | payment_confirmed | payment_rejected |
 *        welcome_bonus | referral_reward | order_update | info
 */
async function notify(userId, { type, title, message }) {
  try {
    await supabase.from('notifications').insert({ user_id: userId, type, title, message });
  } catch (err) {
    console.error('[notify]', err.message);
  }
}

module.exports = { notify };
