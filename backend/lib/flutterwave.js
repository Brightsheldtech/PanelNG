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

  async createVirtualAccount({ email, txRef, firstname, lastname, phonenumber, narration }) {
    const res = await client.post('/virtual-account-numbers', {
      email,
      is_permanent: true,
      tx_ref: txRef,
      phonenumber: phonenumber || '08000000000',
      firstname: firstname || 'Customer',
      lastname: lastname || 'User',
      narration: narration || 'PanelNG Wallet',
    });
    return res.data;
  },
};

module.exports = flutterwave;
