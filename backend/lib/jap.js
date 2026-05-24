const axios = require('axios');
require('dotenv').config();

const JAP_URL = process.env.JAP_API_URL || 'https://justanotherpanel.com/api/v2';
const JAP_KEY = process.env.JAP_API_KEY;

const jap = {
  async getServices() {
    const params = new URLSearchParams({ key: JAP_KEY, action: 'services' });
    const res = await axios.post(JAP_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  async placeOrder({ service, link, quantity }) {
    const params = new URLSearchParams({ key: JAP_KEY, action: 'add', service, link, quantity });
    const res = await axios.post(JAP_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  async getOrderStatus(orderId) {
    const params = new URLSearchParams({ key: JAP_KEY, action: 'status', order: orderId });
    const res = await axios.post(JAP_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  async getMultipleStatuses(orderIds) {
    const params = new URLSearchParams({ key: JAP_KEY, action: 'status', orders: orderIds.join(',') });
    const res = await axios.post(JAP_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },

  async getBalance() {
    const params = new URLSearchParams({ key: JAP_KEY, action: 'balance' });
    const res = await axios.post(JAP_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },
};

module.exports = jap;
