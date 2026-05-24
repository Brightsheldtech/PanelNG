const axios = require('axios');
require('dotenv').config();

const BASE = 'https://api.paystack.co';

const client = axios.create({
  baseURL: BASE,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

const paystack = {
  async initializeTransaction({ email, amount, reference, callback_url, metadata }) {
    const res = await client.post('/transaction/initialize', {
      email,
      amount: Math.round(amount * 100), // kobo
      reference,
      callback_url,
      metadata,
    });
    return res.data;
  },

  async verifyTransaction(reference) {
    const res = await client.get(`/transaction/verify/${reference}`);
    return res.data;
  },
};

module.exports = paystack;
