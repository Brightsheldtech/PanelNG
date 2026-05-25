const supabase = require('./supabase');

let _cached = null;
let _cachedAt = 0;
const CACHE_MS = 5 * 60 * 1000; // 5 min

async function getExchangeRate() {
  if (_cached && Date.now() - _cachedAt < CACHE_MS) return _cached;
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'exchange_rate')
      .single();
    _cached = Number(data?.value || 2900);
    _cachedAt = Date.now();
    return _cached;
  } catch {
    return 2900; // safe default if table not yet created
  }
}

module.exports = { getExchangeRate };
