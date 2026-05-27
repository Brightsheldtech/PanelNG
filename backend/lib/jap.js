const axios = require('axios');
require('dotenv').config();

const JAP_URL = process.env.JAP_API_URL || 'https://justanotherpanel.com/api/v2';
const JAP_KEY = process.env.JAP_API_KEY;

async function japPost(params) {
  try {
    const res = await axios.post(JAP_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  } catch (err) {
    // Sanitize — never let supplier name or URL leak to callers
    if (err.message && !err.response) throw new Error('Service unavailable. Please try again.');
    throw err;
  }
}

const jap = {
  async getServices() {
    return japPost(new URLSearchParams({ key: JAP_KEY, action: 'services' }));
  },

  async placeOrder({ service, link, quantity }) {
    return japPost(new URLSearchParams({ key: JAP_KEY, action: 'add', service, link, quantity }));
  },

  async getOrderStatus(orderId) {
    return japPost(new URLSearchParams({ key: JAP_KEY, action: 'status', order: orderId }));
  },

  async getMultipleStatuses(orderIds) {
    return japPost(new URLSearchParams({ key: JAP_KEY, action: 'status', orders: orderIds.join(',') }));
  },

  async getBalance() {
    return japPost(new URLSearchParams({ key: JAP_KEY, action: 'balance' }));
  },
};

module.exports = jap;
