export function generateReferralCode(fullName) {
  const letters = fullName
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');
  const digits = Math.floor(100 + Math.random() * 900).toString();
  return `PNG-${letters}${digits}`;
}
