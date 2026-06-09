const jap = require('./jap');
const smmraja = require('./smmraja');

const PROVIDERS = {
  jap: { name: 'jap', label: 'JustAnotherPanel', client: jap },
  smmraja: { name: 'smmraja', label: 'SMMRaja', client: smmraja },
};

function getProvider(name) {
  return (PROVIDERS[name] || PROVIDERS.jap).client;
}

module.exports = { PROVIDERS, getProvider };
