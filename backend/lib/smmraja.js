const axios = require('axios');

const SMMRAJA_URL = 'https://smmraja.com/api/v2';

async function post(params) {
  params.append('key', process.env.SMMRAJA_API_KEY);
  try {
    const res = await axios.post(SMMRAJA_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  } catch (err) {
    if (err.message && !err.response) throw new Error('SMMRaja unavailable. Please try again.');
    throw err;
  }
}

const smmraja = {
  async getServices() {
    return post(new URLSearchParams({ action: 'services' }));
  },
  async placeOrder({ service, link, quantity }) {
    return post(new URLSearchParams({ action: 'add', service, link, quantity }));
  },
  async getOrderStatus(orderId) {
    return post(new URLSearchParams({ action: 'status', order: orderId }));
  },
  async getMultipleStatuses(orderIds) {
    return post(new URLSearchParams({ action: 'status', orders: orderIds.join(',') }));
  },
  async getBalance() {
    return post(new URLSearchParams({ action: 'balance' }));
  },
};

module.exports = smmraja;
