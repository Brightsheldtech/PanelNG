const axios = require('axios');
require('dotenv').config();

const BASE = 'https://hero-sms.com/stubs/handler_api.php';
const API_KEY = process.env.HEROSMS_API_KEY;

// Map display names → sms-activate 2-letter service codes
const SERVICE_CODES = {
  whatsapp: 'wa',
  telegram: 'tg',
  instagram: 'ig',
  tiktok: 'tt',
  facebook: 'fb',
  twitter: 'tw',
  gmail: 'go',
  google: 'go',
  snapchat: 'sc',
  viber: 'vi',
  tinder: 'ti',
  netflix: 'nf',
  uber: 'ub',
  binance: 'bn',
  discord: 'di',
  airbnb: 'ab',
  paypal: 'pp',
  shopify: 'sh',
  amazon: 'am',
  microsoft: 'ms',
  yahoo: 'ya',
};

// Full code → readable name mapping (covers all known sms-activate / HeroSMS codes)
const CODE_TO_NAME = {
  // Messaging & Social
  wa: 'WhatsApp', tg: 'Telegram', ig: 'Instagram', tt: 'TikTok',
  fb: 'Facebook', tw: 'Twitter / X', sc: 'Snapchat', vi: 'Viber',
  sk: 'Skype', si: 'Signal', wb: 'WeChat', li: 'Line', kk: 'KakaoTalk',
  ln: 'LinkedIn', yt: 'YouTube', rd: 'Reddit', tu: 'Tumblr', tv: 'Twitch',
  pn: 'Pinterest', so: 'SoundCloud', be: 'BeReal', im: 'IMO Messenger',
  kw: 'Kwai', bt: 'Badoo', bu: 'Bumble', ti: 'Tinder', gk: 'Grindr',
  on: 'OnlyFans', vk: 'VKontakte', ok: 'Odnoklassniki', mm: 'Mail.ru',
  sn: 'Sina Weibo', dy: 'Douyin (Chinese TikTok)', ks: 'Kuaishou',
  zp: 'Zepeto', nx: '9GAG', me: 'MeWe',
  ds: 'Discord', mo: 'Bumble', qv: 'Badoo', yl: 'Yalla', mj: 'Zalo',
  dc: 'YikYak', mx: 'SoulApp', xs: 'GroupMe', vy: 'Meta',
  lk: 'Pure', pu: 'Justdating',
  // Google / Apple / Microsoft
  go: 'Google / Gmail', ms: 'Microsoft', ap: 'Apple / iCloud',
  gh: 'GitHub', zo: 'Zoom', sl: 'Slack', dr: 'Dropbox',
  wx: 'Apple', ma: 'Mail.ru',
  // E-Commerce & Delivery
  am: 'Amazon', ep: 'eBay', sh: 'Shopify', wm: 'Walmart',
  al: 'AliExpress', ta: 'Taobao', jd: 'JD.com', lz: 'Lazada',
  tk: 'Tokopedia', ol: 'OLX', nk: 'Nike', za: 'Zara',
  pm: 'Poshmark', ra: 'Rappi', gl: 'Glovo', wp: 'Wolt',
  ue: 'Uber Eats', dt: 'DoorDash', lf: 'Lyft', ub: 'Uber',
  gr: 'Grab', gj: 'GoJek', cr: 'Careem', sb2: 'Swiggy',
  ab: 'Airbnb', uk: 'Airbnb', hw: 'Alipay / Alibaba',
  ac: 'DoorDash', dl: 'Lazada', wr: 'Walmart',
  ka: 'Shopee', kh: 'Bukalapak', ni: 'Gojek', xk: 'DiDi',
  ws: 'Indodax', bc: 'GCash', bp: 'GoFundMe', yu: 'Xiaomi', sg: 'Ozon',
  fr: 'Dana', ls: 'Careem', do: 'Leboncoin', mk: 'LongHu',
  // Finance & Payments
  pp: 'PayPal', bn: 'Binance', cb: 'Coinbase', oi: 'OKX',
  cy: 'Crypto.com', kc: 'KuCoin', kp: 'Kraken', rc: 'Revolut',
  wi: 'Wise', wu: 'Western Union', wu2: 'Western Union',
  ve: 'Venmo', cs: 'Cash App', rb: 'Robinhood', mt: 'Mercado Pago',
  qr: 'QIWI Wallet', pi: 'PhonePe', pt: 'Paytm', mb: 'Mobikwik',
  fi: 'Fi Money', sy: 'Swyftx', gg: 'Google Pay', st: 'Stripe',
  it: 'Cash App', nc: 'Payoneer', qb: 'Payberry',
  // Entertainment & Gaming
  nf: 'Netflix', sp: 'Spotify', hu: 'Hulu', hs: 'Hotstar (Disney+)',
  ps: 'PlayStation Network', xb: 'Xbox', sx: 'Steam',
  pb: 'PUBG Mobile', rl: 'Roblox', su: 'Supercell (Clash of Clans)',
  ah: 'Escape From Tarkov', bz: 'Blizzard', uf: 'Eneba',
  gb: 'YouStar', gp: 'Ticketmaster', zy: 'Nttgame', pc: 'Casino / Gambling',
  // Food & Dining
  sd: 'DodoPizza', dz: 'Dominos Pizza', ry: 'McDonalds',
  fz: 'KFC', ip: 'Burger King', sr: 'Starbucks', ea: 'JamesDelivery',
  // Transport
  ua: 'BlaBlaCar', tx: 'Bolt', sv: 'Dostavista', gt: 'Gett',
  // Fuel
  afk: 'Chevron',
  // Food Delivery
  aq: 'Glovo',
  // Other services
  xx: 'Joyride',
  // Russia / Eastern Europe
  oz: 'Ozon', av: 'Avito', ym: 'Yandex', ya: 'Yahoo',
  fo: 'Fotostrana', fd: 'Mamba Dating', rs: 'Lotus',
  // Tech & Misc
  di: 'Discord', uc: 'Udemy', up: 'Upwork', ub2: 'Uber',
  em: 'Emirates Airlines', hy: 'Hyundai', xi: 'Xiaomi', bl: 'Bolt',
  sb: 'Starbucks', oi2: 'OKX', up2: 'Upwork',
  gs: 'Samsung Shop', lu: 'Crickpe', oo: 'LigaPro',
  // Asian Apps
  hs2: 'HotStar', gj2: 'GoJek',
  // African-relevant
  im2: 'IMO', kw2: 'Kwai',
  // Other
  ot: 'Any Other Service',
};

function toCode(product) {
  return SERVICE_CODES[product.toLowerCase().trim()] || product.toLowerCase().trim();
}

async function call(params) {
  const res = await axios.get(BASE, {
    params: { api_key: API_KEY, ...params },
    timeout: 15000,
  });
  return res.data;
}

const herosms = {
  async getBalance() {
    const raw = await call({ action: 'getBalance' });
    // Response: "ACCESS_BALANCE:12.50"
    if (typeof raw === 'string' && raw.startsWith('ACCESS_BALANCE:')) {
      return { balance: parseFloat(raw.split(':')[1]) };
    }
    return { balance: 0 };
  },

  async getPrices(product) {
    const service = toCode(product);

    const [pricesData, countriesData] = await Promise.all([
      call({ action: 'getPrices', service }),
      call({ action: 'getCountries' }),
    ]);

    if (!pricesData || typeof pricesData !== 'object') return [];

    const result = [];
    for (const [countryId, services] of Object.entries(pricesData)) {
      const entry = services[service];
      if (!entry || entry.count < 1) continue;
      const country = countriesData[countryId];
      if (!country || !country.visible) continue;

      result.push({
        countryId: parseInt(countryId),
        country: country.eng,
        count: entry.count,
        cost: entry.cost,
        price: entry.cost,
      });
    }

    // Nigeria first, then cheapest
    result.sort((a, b) => {
      if (a.country === 'Nigeria') return -1;
      if (b.country === 'Nigeria') return 1;
      return a.cost - b.cost;
    });

    return result;
  },

  async getProducts() {
    // Return the supported service list
    const seen = new Set();
    return Object.entries(SERVICE_CODES)
      .filter(([, code]) => !seen.has(code) && seen.add(code))
      .map(([name]) => ({ name: name[0].toUpperCase() + name.slice(1), code: SERVICE_CODES[name] }));
  },

  async getAllServices() {
    // Fetch ALL available services from HeroSMS by calling getPrices without a service filter
    const [pricesData, countriesData, svcListData] = await Promise.all([
      call({ action: 'getPrices' }),
      call({ action: 'getCountries' }),
      call({ action: 'getServicesList' }),
    ]);

    if (!pricesData || typeof pricesData !== 'object') return [];

    // Build authoritative name lookup from HeroSMS's own service list
    const officialNames = {};
    if (svcListData?.services) {
      for (const svc of svcListData.services) {
        if (svc.code && svc.name) officialNames[svc.code] = svc.name;
      }
    }

    // Aggregate counts and costs across all countries per service code
    const services = {};
    for (const [countryId, svcs] of Object.entries(pricesData)) {
      const country = countriesData?.[countryId];
      if (!country || !country.visible) continue;
      for (const [code, entry] of Object.entries(svcs)) {
        if (!entry || entry.count < 1) continue;
        if (!services[code]) {
          const name = officialNames[code] || CODE_TO_NAME[code] || code.toUpperCase();
          services[code] = { code, name, totalCount: 0, minCost: Infinity, maxCost: 0, countryCount: 0 };
        }
        services[code].totalCount += entry.count;
        services[code].minCost = Math.min(services[code].minCost, entry.cost);
        services[code].maxCost = Math.max(services[code].maxCost, entry.cost);
        services[code].countryCount++;
      }
    }

    return Object.values(services)
      .map((s) => ({ ...s, minCost: s.minCost === Infinity ? 0 : s.minCost }))
      .sort((a, b) => b.totalCount - a.totalCount);
  },

  async buyNumber(product, country) {
    const service = toCode(product);

    // country can be a numeric ID or a country name string
    let countryId = parseInt(country);
    if (isNaN(countryId)) {
      const countries = await call({ action: 'getCountries' });
      const match = Object.entries(countries).find(
        ([, c]) => c.eng?.toLowerCase() === country.toLowerCase()
      );
      if (!match) throw new Error('This service is not available in your region.');
      countryId = parseInt(match[0]);
    }

    const raw = await call({ action: 'getNumber', service, country: countryId });
    // Response: "ACCESS_NUMBER:orderId:phoneNumber" or error string
    if (typeof raw === 'string' && raw.startsWith('ACCESS_NUMBER:')) {
      const parts = raw.split(':');
      return { orderId: parts[1], number: '+' + parts[2] };
    }

    const msgs = {
      NO_NUMBERS: 'No numbers available for this service right now. Try another country.',
      NO_BALANCE: 'This service is temporarily unavailable. Please try again later.',
      BAD_SERVICE: 'This service is not currently supported.',
    };
    throw new Error(msgs[raw] || 'Service unavailable. Please try again.');
  },

  async checkOrder(orderId) {
    const raw = await call({ action: 'getStatus', id: orderId });
    // Possible responses:
    // "STATUS_WAIT_CODE"
    // "STATUS_OK:123456"
    // "STATUS_WAIT_RETRY:123456"
    // "STATUS_CANCEL"
    if (typeof raw === 'string') {
      if (raw.startsWith('STATUS_OK:') || raw.startsWith('STATUS_WAIT_RETRY:')) {
        return { smsCode: raw.split(':')[1], status: raw };
      }
      return { smsCode: null, status: raw };
    }
    return { smsCode: null, status: 'unknown' };
  },

  async finishOrder(orderId) {
    // status 6 = mark as done (received code)
    const raw = await call({ action: 'setStatus', id: orderId, status: 6 });
    return { success: true, raw };
  },

  async cancelOrder(orderId) {
    // status 8 = cancel and get refund
    const raw = await call({ action: 'setStatus', id: orderId, status: 8 });
    return { success: true, raw };
  },
};

herosms.toServiceCode = toCode;

module.exports = herosms;
