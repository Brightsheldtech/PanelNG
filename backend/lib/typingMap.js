const map = new Map();
const TTL = 6000; // 6 s — client polls every 4 s so this gives a comfortable window

module.exports = {
  set(convId)   { map.set(convId, Date.now()); },
  isActive(convId) { return (map.get(convId) || 0) > Date.now() - TTL; },
};
