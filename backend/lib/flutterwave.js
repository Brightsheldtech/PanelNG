const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.flutterwave.com/v3',
  headers: {
    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

const flutterwave = {
  async verifyById(transactionId) {
    const res = await client.get(`/transactions/${transactionId}/verify`);
    return res.data;
  },

  async verifyByRef(txRef) {
    const res = await client.get(`/transactions?tx_ref=${txRef}`);
    return res.data;
  },
};

module.exports = flutterwave;
