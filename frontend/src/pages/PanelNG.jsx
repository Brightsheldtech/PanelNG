import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import BuyAccounts from './BuyAccounts';

// ─── THEME ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ theme: 'system', setTheme: () => {}, resolved: 'dark' });

function ThemeProvider({ children }) {
  const [theme, setRaw] = useState(() => localStorage.getItem('panelng-theme') || 'system');
  const [resolved, setResolved] = useState('dark');
  const setTheme = (t) => { setRaw(t); localStorage.setItem('panelng-theme', t); };
  useEffect(() => {
    const r = (t) => t === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
    setResolved(r(theme));
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const h = (e) => setResolved(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', h);
      return () => mq.removeEventListener('change', h);
    }
  }, [theme]);
  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK = {
  user: { name: 'Adedayo Adedoyin', email: 'adedayoadedoyin245@gmail.com', role: 'user', balance: 499.85, totalOrders: 2, totalSpent: 0.15, initials: 'AA' },
  orders: [
    { id: '233d5234', type: 'sms', platform: 'WhatsApp', phone: '+27833980213', country: 'South Africa', status: 'finished', amount: 0.15 },
    { id: '9d6486ab', type: 'sms', platform: 'WhatsApp', phone: '+14386665757', country: 'Canada', status: 'completed', amount: 0.00 },
    { id: 'ac7823ef', type: 'accounts', platform: 'Facebook', product_name: 'Facebook USA Aged Account', quantity: 2, status: 'completed', amount: 1800 },
    { id: 'ac3391bc', type: 'accounts', platform: 'Gmail', product_name: 'Gmail Account + Recovery', quantity: 1, status: 'completed', amount: 650 },
  ],
  transactions: [
    { desc: 'SMS number — whatsapp (South Africa)', date: '23/05/2026', amount: -0.15 },
    { desc: 'Bank deposit — PNG-4625-ADE', date: '23/05/2026', amount: 500.00 },
    { desc: 'Bank deposit — PNG-4625-ADE', date: '23/05/2026', amount: 500.00 },
    { desc: 'Bank deposit — PNG-4625-ADE', date: '23/05/2026', amount: 500.00 },
  ],
  services: {
    Facebook: [
      { id: 'fb1', name: 'Facebook Page Likes', rate: 350, min: 100, max: 50000, tags: ['Refill', 'High Speed'], quality: 'high' },
      { id: 'fb2', name: 'Facebook Post Likes', rate: 280, min: 50, max: 100000, tags: ['Max', 'Instant'], quality: 'high' },
      { id: 'fb3', name: 'Facebook Followers', rate: 420, min: 100, max: 20000, tags: ['Refill'], quality: 'medium' },
      { id: 'fb4', name: 'Facebook Video Views', rate: 90, min: 1000, max: 1000000, tags: ['Instant', 'Max'], quality: 'high' },
      { id: 'fb5', name: 'Facebook Story Views', rate: 70, min: 500, max: 500000, tags: ['Fast'], quality: 'medium' },
    ],
    Instagram: [
      { id: 'ig1', name: 'Instagram Followers [Real]', rate: 650, min: 100, max: 10000, tags: ['Refill', 'Max'], quality: 'high' },
      { id: 'ig2', name: 'Instagram Likes [Premium]', rate: 180, min: 50, max: 50000, tags: ['Instant', 'Refill'], quality: 'high' },
      { id: 'ig3', name: 'Instagram Video Views', rate: 45, min: 500, max: 2000000, tags: ['Instant', 'Max'], quality: 'high' },
      { id: 'ig4', name: 'Instagram Story Views', rate: 60, min: 200, max: 1000000, tags: ['Fast'], quality: 'medium' },
      { id: 'ig5', name: 'Instagram Reel Views', rate: 55, min: 500, max: 5000000, tags: ['Instant'], quality: 'high' },
    ],
    TikTok: [
      { id: 'tt1', name: 'TikTok Followers', rate: 420, min: 100, max: 50000, tags: ['Refill', 'High Speed'], quality: 'high' },
      { id: 'tt2', name: 'TikTok Likes', rate: 150, min: 100, max: 500000, tags: ['Instant', 'Max'], quality: 'high' },
      { id: 'tt3', name: 'TikTok Views', rate: 35, min: 1000, max: 10000000, tags: ['Instant'], quality: 'high' },
      { id: 'tt4', name: 'TikTok Comments', rate: 1200, min: 10, max: 1000, tags: ['Custom'], quality: 'medium' },
      { id: 'tt5', name: 'TikTok Shares', rate: 280, min: 100, max: 100000, tags: ['Fast'], quality: 'medium' },
    ],
    YouTube: [
      { id: 'yt1', name: 'YouTube Subscribers', rate: 850, min: 50, max: 5000, tags: ['Refill', 'Slow Drip'], quality: 'high' },
      { id: 'yt2', name: 'YouTube Views [Monetizable]', rate: 120, min: 1000, max: 1000000, tags: ['Ads Safe', 'Max'], quality: 'high' },
      { id: 'yt3', name: 'YouTube Likes', rate: 380, min: 50, max: 50000, tags: ['Refill'], quality: 'high' },
      { id: 'yt4', name: 'YouTube Watch Hours', rate: 4500, min: 100, max: 5000, tags: ['Monetization'], quality: 'high' },
      { id: 'yt5', name: 'YouTube Comments', rate: 1500, min: 5, max: 500, tags: ['Custom'], quality: 'medium' },
    ],
    Twitter: [
      { id: 'tw1', name: 'Twitter/X Followers', rate: 380, min: 100, max: 50000, tags: ['Refill'], quality: 'medium' },
      { id: 'tw2', name: 'Twitter/X Likes', rate: 120, min: 100, max: 100000, tags: ['Instant', 'Max'], quality: 'high' },
      { id: 'tw3', name: 'Twitter/X Retweets', rate: 220, min: 50, max: 50000, tags: ['Fast'], quality: 'medium' },
      { id: 'tw4', name: 'Twitter/X Impressions', rate: 75, min: 5000, max: 5000000, tags: ['Instant'], quality: 'high' },
      { id: 'tw5', name: 'Twitter/X Poll Votes', rate: 450, min: 100, max: 10000, tags: ['Fast'], quality: 'medium' },
    ],
    Telegram: [
      { id: 'tg1', name: 'Telegram Channel Members', rate: 320, min: 100, max: 100000, tags: ['Real', 'Refill'], quality: 'high' },
      { id: 'tg2', name: 'Telegram Post Views', rate: 55, min: 500, max: 5000000, tags: ['Instant'], quality: 'high' },
      { id: 'tg3', name: 'Telegram Reactions', rate: 180, min: 100, max: 50000, tags: ['Instant'], quality: 'high' },
      { id: 'tg4', name: 'Telegram Group Members', rate: 400, min: 100, max: 50000, tags: ['Refill'], quality: 'medium' },
      { id: 'tg5', name: 'Telegram Bot Subscribers', rate: 290, min: 50, max: 20000, tags: ['Fast'], quality: 'medium' },
    ],
    Spotify: [
      { id: 'sp1', name: 'Spotify Streams [Premium]', rate: 160, min: 1000, max: 5000000, tags: ['Royalties', 'Max'], quality: 'high' },
      { id: 'sp2', name: 'Spotify Followers', rate: 480, min: 50, max: 10000, tags: ['Refill'], quality: 'high' },
      { id: 'sp3', name: 'Spotify Monthly Listeners', rate: 350, min: 500, max: 500000, tags: ['Boost'], quality: 'high' },
      { id: 'sp4', name: 'Spotify Playlist Followers', rate: 280, min: 100, max: 20000, tags: ['Fast'], quality: 'medium' },
      { id: 'sp5', name: 'Spotify Saves/Likes', rate: 220, min: 100, max: 50000, tags: ['Instant'], quality: 'medium' },
    ],
  },
  bankDetails: [{ bank: 'Access Bank', number: '0123456789', name: 'BRIGHTSHELD TECH LTD' }],
};

const ALL_SERVICES = Object.values(MOCK.services).flat();
const PLATFORMS = ['All', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'Twitter', 'Telegram', 'WhatsApp', 'Snapchat', 'Spotify', 'Threads', 'LinkedIn'];
const SMS_APPS = ['WhatsApp', 'Telegram', 'Instagram', 'TikTok', 'Facebook', 'Twitter', 'Gmail', 'Snapchat', 'Viber', 'Tinder', 'Netflix', 'Uber', 'Airbnb', 'PayPal', 'Binance', 'Discord', 'Other'];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
function PlatformIcon({ name, size = 20 }) {
  const s = size;
  const icons = {
    Facebook: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1877F2"/><path d="M16 3h-2.5C11.6 3 10 4.6 10 7.5V10H7v4h3v9h4v-9h2.9L17.5 10H14V8c0-1.1.4-2 2-2H16V3z" fill="white"/></svg>,
    Instagram: <svg width={s} height={s} viewBox="0 0 24 24"><defs><radialGradient id="pn-ig" cx="30%" cy="110%" r="150%"><stop offset="0%" stopColor="#FCAF45"/><stop offset="50%" stopColor="#FD1D1D"/><stop offset="100%" stopColor="#833AB4"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#pn-ig)"/><rect x="6.5" y="6.5" width="11" height="11" rx="3" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="16.5" cy="7.5" r="0.75" fill="white"/></svg>,
    TikTok: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#010101"/><path d="M17 8.4a4.3 4.3 0 01-2.6-.9v5.8a4.2 4.2 0 11-4.2-4.2h.4v2.1h-.4a2.1 2.1 0 102.1 2.1V3h2.1a4.3 4.3 0 004.3 4.2v2.1A4.3 4.3 0 0117 8.4z" fill="white"/><path d="M17 8.4a4.3 4.3 0 004.3-.8v-.2A4.3 4.3 0 0117 8.4z" fill="#69C9D0"/></svg>,
    YouTube: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF0000"/><path d="M20 12s0-2.5-.3-3.7a2 2 0 00-1.4-1.4C17.2 6.6 12 6.6 12 6.6s-5.2 0-6.3.3a2 2 0 00-1.4 1.4C4 9.5 4 12 4 12s0 2.5.3 3.7a2 2 0 001.4 1.4C6.8 17.4 12 17.4 12 17.4s5.2 0 6.3-.3a2 2 0 001.4-1.4C20 14.5 20 12 20 12z" fill="white" fillOpacity=".9"/><polygon points="10,9.5 15.5,12 10,14.5" fill="#FF0000"/></svg>,
    Twitter: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><path d="M17.5 5h2.1l-4.6 5.3 5.4 7.2H17l-3.3-4.4-3.8 4.4H7.8l4.9-5.6L7 5h4.6l3 4zm-.7 11.2h1.2L7.3 6.3H6z" fill="white"/></svg>,
    Telegram: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#2AABEE"/><path d="M19.8 5.5L4.3 11.7c-1 .4-1 1-.2 1.2l3.8 1.2 8.8-5.6c.4-.3.8-.1.5.2L9.6 14.5v2.3l1.8-1.8 3.9 2.9c.7.4 1.2.2 1.4-.7l2.5-11.7c.3-1-.4-1.5-1.4-1z" fill="white"/></svg>,
    WhatsApp: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#25D366"/><path d="M12 4.5C7.9 4.5 4.5 7.9 4.5 12c0 1.5.4 3 1.2 4.2L4.5 19.5l3.3-1.2C9 19 10.5 19.5 12 19.5c4.1 0 7.5-3.4 7.5-7.5S16.1 4.5 12 4.5zm3.9 10.2c-.2.5-.9 1-1.4 1.1-.4.1-.9.1-2.7-.6-2.3-.9-3.7-3.2-3.8-3.4-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8.2-.2.5-.3.7-.3h.5c.2 0 .4.1.6.5l.8 1.9c.1.2.1.4 0 .6l-.3.5c-.1.1-.2.3-.1.5.4.7.9 1.3 1.5 1.7.7.5 1.3.7 1.6.8.2.1.4 0 .5-.1l.5-.6c.1-.2.3-.3.6-.2l1.8.8c.2.1.4.2.5.4.1.5-.1 1.3-.4 1.9z" fill="white"/></svg>,
    Gmail: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#fff"/><path d="M4 7h16v10H4z" fill="none"/><path d="M4 7l8 6 8-6" stroke="#EA4335" strokeWidth="1.5" fill="none"/><rect x="4" y="7" width="16" height="10" rx="1" stroke="#EA4335" strokeWidth="1.5" fill="none"/><path d="M4 7v10l4.5-5M20 7v10l-4.5-5" stroke="#EA4335" strokeWidth="1.5" fill="none"/></svg>,
    Snapchat: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FFFC00"/><path d="M12 4.5c-2 0-3.5 1.5-3.5 3.5v2c-.3.1-.7.2-1 .3-.1.5.1.8.5.9.5.1.7.5.6 1-.1.4-.5.8-1.1 1.2.2.5.6.6 1.1.6.2 0 .5 0 .8-.1.5.7 1.3 1.1 2.6 1.1s2.1-.4 2.6-1.1c.3.1.6.1.8.1.5 0 .9-.1 1.1-.6-.6-.4-1-.8-1.1-1.2-.1-.5.1-.9.6-1 .4-.1.6-.4.5-.9-.3-.1-.7-.2-1-.3V8c0-2-1.5-3.5-3.5-3.5z" fill="#1A1917"/></svg>,
    Viber: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#7360F2"/><path d="M12 4c-4 0-6.5 2.5-6.5 6 0 1.8.7 3.4 1.9 4.5L7 17l2.5-.4c.8.4 1.6.6 2.5.6 4 0 6.5-2.5 6.5-6S16 4 12 4zm3 8.5c-.2.5-.9.9-1.3.9h-.2c-.5-.1-1.8-.7-2.7-1.7-.9-.9-1.5-2-1.6-2.5 0-.1 0-.2 0-.3 0-.4.3-1 .8-1.3h.3c.1 0 .2 0 .3.1l1 1.5c0 .1 0 .2-.1.3l-.3.4c-.1.1-.1.2 0 .3.3.5.7 1 1.2 1.4.5.4 1 .7 1.5.9.1 0 .2 0 .3-.1l.4-.4c.1-.1.2-.1.3-.1l1.5.8c.1 0 .2.1.2.2-.2.3-.5.7-.6.6z" fill="white"/></svg>,
    Tinder: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF6B6B"/><path d="M12 19.5c-3 0-5.5-2.5-5.5-5.5 0-2 1.5-4 3-5.5-0.5 2.5 1.5 3.5 1.5 3.5s-0.5-3.5 3-6c0 0-1 4.5 3 6.5 1 .5 1.5 1.5 1.5 2.5 0 2.5-2 4.5-4.5 4.5z" fill="white"/></svg>,
    Netflix: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#141414"/><path d="M7 4h3l2 9 2-9h3l-3 8 3 8h-3l-2-9-2 9H7l3-8z" fill="#E50914"/></svg>,
    Uber: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><text x="5" y="17" fontSize="12" fontWeight="700" fill="white" fontFamily="sans-serif">Uber</text></svg>,
    Airbnb: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF5A5F"/><path d="M12 5c-1.5 0-2.5 1.2-2.5 2.5 0 1.7 2.5 5.5 2.5 5.5s2.5-3.8 2.5-5.5C14.5 6.2 13.5 5 12 5zm0 9.5c-2 0-6 1.8-6 3.5 0 .8.7 1.5 2 2h8c1.3-.5 2-1.2 2-2 0-1.7-4-3.5-6-3.5z" fill="white"/></svg>,
    PayPal: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#003087"/><path d="M9 5h4c2 0 3.5 1 3.5 3s-1.5 4-4 4h-2l-1 5H7l2-12zm2 5.5h1.5c1.2 0 2-.6 2-1.5s-.8-1.5-2-1.5h-2l.5 3z" fill="white"/><path d="M13 7h4c2 0 3.5 1 3.5 3s-1.5 4-4 4h-2l-1 5h-2.5l2-12z" fill="#009CDE" opacity="0.8"/></svg>,
    Binance: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1A1917"/><path d="M12 4l-2 2-3-3L5 5l3 3-3 3 2 2 3-3 3 3 2-2-3-3 3-3-2-2zm4 8l-2 2 2 2 2-2-2-2zM12 17l-3 3 2 2 3-3 3 3 2-2-3-3-2 2-2-2z" fill="#F3BA2F"/></svg>,
    Discord: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#5865F2"/><path d="M17.5 6.5c-1.2-.6-2.5-.9-3.9-1l-.2.3c1.3.3 2.5.8 3.6 1.6-1.5-.8-3.2-1.2-4.9-1.2s-3.5.4-4.9 1.2c1.1-.8 2.4-1.3 3.7-1.6L10.7 5.5c-1.4.1-2.8.5-4 1.1C5.6 9.1 5 12 5 14.7c1.3 1.5 3.3 2.3 5.4 2.3l.7-1C10.2 15.7 9.4 15 9 14.2c.3.2.7.4 1 .5a8.7 8.7 0 003.8.9c1.3 0 2.7-.3 3.9-.9.3-.1.7-.3 1-.5-.4.8-1.3 1.5-2.2 1.8l.7 1c2.1 0 4.1-.8 5.4-2.3C22 12 21.4 9.1 20.3 7c-.9-.4-2-.8-2.8-.5zM9.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="white"/></svg>,
    Spotify: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#1DB954"/><path d="M16.7 15.1c-.2-.3-.6-.4-.9-.2-2.5 1.5-5.7 1.9-9.4 1-.3-.1-.7.1-.8.5-.1.3.1.7.5.8 4.1 1 7.7.5 10.5-1.1.3-.2.3-.6.1-1zm1.1-2.8c-.3-.4-.8-.5-1.2-.3-3 1.8-7.5 2.3-11 1.3-.4-.1-.9.1-1 .5-.1.4.1.9.5 1 4 1.1 9 .5 12.4-1.5.4-.2.5-.7.3-1zm.1-2.9c-3.5-2.1-9.4-2.3-12.7-1.3-.5.2-.8.7-.6 1.2.2.5.7.8 1.2.6 2.9-.9 8.1-.7 11.2 1.1.4.3.9.1 1.2-.3.2-.5.1-1-.3-1.3z" fill="white"/></svg>,
    Threads: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><path d="M16 9.5c-.3-.1-.7-.2-1-.3C14.7 7.4 13.4 6.5 12 6.5c-2.2 0-4 1.8-4 4 0 .8.3 1.6.7 2.2-.4.4-.7 1-.7 1.8 0 1.7 1.3 3 3 3 1.1 0 2.1-.6 2.6-1.5.3.1.5.1.8.1 1.4 0 2.6-1.1 2.6-2.5 0-.8-.4-1.5-.9-2 .5-.5.9-1.3.9-2.1z" fill="white"/></svg>,
    LinkedIn: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0A66C2"/><path d="M7 9h2v8H7zm1-1.5a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zM11 9h2v1.1c.3-.6 1-1.1 2.2-1.1C17 9 18 10.1 18 12v5h-2v-4.5c0-1-.6-1.5-1.4-1.5-.9 0-1.6.6-1.6 1.7V17H11V9z" fill="white"/></svg>,
    Other: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#6B6860"/><circle cx="8" cy="12" r="1.5" fill="white"/><circle cx="12" cy="12" r="1.5" fill="white"/><circle cx="16" cy="12" r="1.5" fill="white"/></svg>,
  };
  return icons[name] || icons['Other'];
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ status, type }) {
  if (type === 'sms') return <span className="pn-badge pn-badge-sms">SMS</span>;
  if (type === 'smm') return <span className="pn-badge pn-badge-smm">SMM</span>;
  if (type === 'accounts') return <span className="pn-badge pn-badge-accounts">ACCOUNTS</span>;
  const s = (status || '').toLowerCase();
  const cls = ['finished','completed'].includes(s) ? 'success' : s === 'pending' ? 'accent' : 'danger';
  return <span className={`pn-badge pn-badge-${cls}`}>{status}</span>;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.pn-root*,.pn-root *::before,.pn-root *::after{box-sizing:border-box;margin:0;padding:0}
.pn-root{font-family:'Plus Jakarta Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:-0.01em;background:var(--bg-base);color:var(--text-primary);min-height:100vh;font-size:15px;line-height:1.5}
.pn-root[data-theme="light"]{--bg-base:#F6F5F2;--bg-surface:#FFFFFF;--bg-raised:#F0EEE9;--bg-input:#FAFAF8;--border:#E2E0D8;--border-strong:#C8C5BC;--text-primary:#1A1917;--text-secondary:#6B6860;--text-muted:#9E9B94;--accent:#D97706;--accent-hover:#B45309;--accent-text:#FFFFFF;--success:#16A34A;--danger:#DC2626;--info:#2563EB;--tag-bg:#EDE9DC;--tag-text:#78716C;--chip-active-bg:#1A1917;--chip-active-text:#FFFFFF;--shadow-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);--shadow-md:0 4px 16px rgba(0,0,0,.08)}
.pn-root[data-theme="dark"]{--bg-base:#0F0F0D;--bg-surface:#1A1917;--bg-raised:#242320;--bg-input:#18181B;--border:#2C2B27;--border-strong:#3D3C37;--text-primary:#F0EEE9;--text-secondary:#A8A49C;--text-muted:#6B6860;--accent:#F59E0B;--accent-hover:#FBBF24;--accent-text:#1A1917;--success:#22C55E;--danger:#F87171;--info:#60A5FA;--tag-bg:#2C2B27;--tag-text:#A8A49C;--chip-active-bg:#F0EEE9;--chip-active-text:#1A1917;--shadow-sm:0 1px 3px rgba(0,0,0,.25);--shadow-md:0 4px 16px rgba(0,0,0,.4)}

/* Layout */
.pn-shell{display:flex;min-height:100vh}
.pn-sidebar{width:240px;flex-shrink:0;background:var(--bg-surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:200;overflow-y:auto}
.pn-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh}
.pn-content{flex:1;overflow-y:auto;padding:24px 24px 100px;scrollbar-width:none}
.pn-content::-webkit-scrollbar{display:none}

/* Topbar */
.pn-topbar{height:60px;background:var(--bg-surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 20px;gap:12px;position:sticky;top:0;z-index:50;flex-shrink:0}
.pn-hamburger{width:34px;height:34px;background:var(--bg-raised);border:1px solid var(--border);border-radius:10px;display:none;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);transition:all 150ms ease;flex-shrink:0}
.pn-hamburger:hover{background:var(--border);color:var(--text-primary)}
.pn-topbar-brand{display:flex;align-items:center;gap:8px;flex:1}
.pn-brand-mark{width:28px;height:28px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--accent-text);font-weight:700;font-size:14px;flex-shrink:0}
.pn-brand-name{font-weight:600;font-size:16px;color:var(--text-primary)}
.pn-balance-chip{display:flex;flex-direction:column;align-items:flex-end;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:5px 12px;cursor:default}
.pn-root[data-theme="light"] .pn-balance-chip{background:rgba(217,119,6,.08);border-color:rgba(217,119,6,.25)}
.pn-balance-chip-label{font-family:'Geist Mono','Courier New',monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--accent);font-weight:500}
.pn-balance-chip-amount{font-family:'Geist Mono','Courier New',monospace;font-size:14px;font-weight:500;color:var(--accent);white-space:nowrap}
.pn-theme-icon-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--text-muted);border-radius:8px;transition:all 150ms ease;font-size:18px;position:relative}
.pn-theme-icon-btn:hover{background:var(--bg-raised);color:var(--text-primary)}
.pn-tooltip{position:absolute;top:calc(100% + 6px);right:0;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:11px;color:var(--text-secondary);white-space:nowrap;box-shadow:var(--shadow-sm);pointer-events:none;z-index:100}

/* Sidebar */
.pn-sidebar-brand{display:flex;align-items:center;gap:10px;padding:20px 16px 16px;border-bottom:1px solid var(--border)}
.pn-close-btn{margin-left:auto;width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--text-muted);border-radius:6px;font-size:16px;transition:all 150ms ease}
.pn-close-btn:hover{background:var(--bg-raised);color:var(--text-primary)}
.pn-sidebar-wallet{margin:12px;padding:14px 16px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:12px}
.pn-root[data-theme="light"] .pn-sidebar-wallet{background:rgba(217,119,6,.06);border-color:rgba(217,119,6,.15)}
.pn-wallet-label{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px}
.pn-wallet-amount{font-family:'Geist Mono','Courier New',monospace;font-size:20px;font-weight:500;color:var(--accent)}
.pn-sidebar-nav{flex:1;padding:8px 12px}
.pn-nav-label{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-muted);padding:10px 4px 4px}
.pn-nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;color:var(--text-secondary);font-size:14px;font-weight:500;transition:all 150ms ease;background:transparent;border:none;width:100%;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;margin-bottom:2px}
.pn-nav-item:hover{background:var(--bg-raised);color:var(--text-primary)}
.pn-nav-item.active{background:rgba(245,158,11,.12);color:var(--accent);font-weight:600}
.pn-root[data-theme="light"] .pn-nav-item.active{background:rgba(217,119,6,.1)}
.pn-nav-item .ti{font-size:18px;width:20px;text-align:center;flex-shrink:0}
.pn-sidebar-footer{padding:12px;border-top:1px solid var(--border)}
.pn-user-card{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--bg-raised);border:1px solid var(--border);margin-bottom:8px}
.pn-avatar{width:34px;height:34px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--accent-text);font-weight:700;font-size:13px;flex-shrink:0}
.pn-avatar-lg{width:64px;height:64px;background:var(--accent);border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--accent-text);font-weight:700;font-size:22px;margin:0 auto 12px}
.pn-user-name{font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pn-user-role{font-size:11px;color:var(--text-muted)}
.pn-btn-signout{display:flex;align-items:center;gap:8px;width:100%;padding:9px 12px;border-radius:10px;background:transparent;border:1px solid rgba(220,38,38,.25);color:var(--danger);font-size:13px;font-weight:500;cursor:pointer;transition:background 150ms ease;font-family:'Plus Jakarta Sans',sans-serif}
.pn-root[data-theme="dark"] .pn-btn-signout{border-color:rgba(248,113,113,.25)}
.pn-btn-signout:hover{background:rgba(220,38,38,.08)}
.pn-root[data-theme="dark"] .pn-btn-signout:hover{background:rgba(248,113,113,.08)}

/* Page */
.pn-page-title{font-size:22px;font-weight:700;color:var(--text-primary);letter-spacing:-0.5px;margin-bottom:4px}
.pn-page-sub{font-size:13px;color:var(--text-secondary);margin-bottom:20px}
.pn-section-label{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;display:block}

/* Cards */
.pn-card{background:var(--bg-surface);border:1px solid var(--border);border-radius:16px;padding:20px;box-shadow:var(--shadow-sm)}
.pn-card-sm{padding:14px 16px}

/* Stat grid */
.pn-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.pn-stat-card{background:var(--bg-surface);border:1px solid var(--border);border-radius:16px;padding:18px;box-shadow:var(--shadow-sm);transition:box-shadow 150ms ease}
.pn-stat-card:hover{box-shadow:var(--shadow-md)}
.pn-stat-card.full{grid-column:1/-1}
.pn-stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:12px}
.pn-stat-icon.accent{background:rgba(245,158,11,.12);color:var(--accent)}
.pn-stat-icon.success{background:rgba(34,197,94,.1);color:var(--success)}
.pn-stat-icon.info{background:rgba(96,165,250,.1);color:var(--info)}
.pn-root[data-theme="light"] .pn-stat-icon.accent{background:rgba(217,119,6,.1)}
.pn-root[data-theme="light"] .pn-stat-icon.success{background:rgba(22,163,74,.1)}
.pn-root[data-theme="light"] .pn-stat-icon.info{background:rgba(37,99,235,.1)}
.pn-stat-label{font-size:12px;color:var(--text-muted);margin-bottom:4px;font-weight:500}
.pn-stat-value{font-family:'Geist Mono','Courier New',monospace;font-size:22px;font-weight:500;color:var(--text-primary)}
.pn-stat-value.accent{color:var(--accent)}

/* Buttons */
.pn-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:40px;padding:0 18px;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;transition:all 150ms ease;font-family:'Plus Jakarta Sans',sans-serif;border:none;white-space:nowrap}
.pn-btn:active{transform:scale(.98)}
.pn-btn-primary{background:var(--accent);color:var(--accent-text);border:1px solid var(--accent)}
.pn-btn-primary:hover{background:var(--accent-hover);border-color:var(--accent-hover)}
.pn-btn-secondary{background:var(--bg-raised);color:var(--text-primary);border:1px solid var(--border)}
.pn-btn-secondary:hover{border-color:var(--border-strong)}
.pn-btn-ghost{background:transparent;color:var(--text-secondary);border:1px solid transparent}
.pn-btn-ghost:hover{color:var(--text-primary);background:var(--bg-raised)}
.pn-btn-full{width:100%;height:44px;font-size:15px;font-weight:600;border-radius:12px}
.pn-btn-sm{height:32px;padding:0 12px;font-size:12px}
.pn-btn-success{background:rgba(34,197,94,.1);color:var(--success);border:1px solid rgba(34,197,94,.25)}
.pn-btn-success:hover{background:rgba(34,197,94,.18)}
.pn-root[data-theme="light"] .pn-btn-success{background:rgba(22,163,74,.1);color:var(--success);border-color:rgba(22,163,74,.2)}

/* Inputs */
.pn-input-wrap{margin-bottom:14px}
.pn-input-label{display:block;font-size:12px;font-weight:500;color:var(--text-secondary);margin-bottom:6px}
.pn-input{width:100%;height:44px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;padding:0 14px;font-size:14px;color:var(--text-primary);font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border-color 150ms ease,box-shadow 150ms ease}
.pn-input:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(245,158,11,.15)}
.pn-root[data-theme="light"] .pn-input:focus{box-shadow:0 0 0 2px rgba(217,119,6,.12)}
.pn-input::placeholder{color:var(--text-muted)}
.pn-input:disabled{opacity:.5;cursor:not-allowed}
.pn-input-with-icon{position:relative}
.pn-input-with-icon .pn-input{padding-left:40px}
.pn-input-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:16px;pointer-events:none}
.pn-input-eye-wrap{position:relative}
.pn-input-eye-wrap .pn-input{padding-right:44px}
.pn-input-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:16px;padding:0;display:flex;align-items:center}

/* Badges */
.pn-badge{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:100px;font-size:11px;font-weight:500;white-space:nowrap}
.pn-badge-success{background:rgba(34,197,94,.1);color:var(--success);border:1px solid rgba(34,197,94,.2)}
.pn-badge-accent{background:rgba(245,158,11,.12);color:var(--accent);border:1px solid rgba(245,158,11,.2)}
.pn-badge-danger{background:rgba(248,113,113,.1);color:var(--danger);border:1px solid rgba(248,113,113,.2)}
.pn-badge-sms{background:rgba(139,92,246,.1);color:#8B5CF6;border:1px solid rgba(139,92,246,.2)}
.pn-badge-smm{background:rgba(96,165,250,.1);color:var(--info);border:1px solid rgba(96,165,250,.2)}
.pn-badge-accounts{background:rgba(20,184,166,.1);color:#14B8A6;border:1px solid rgba(20,184,166,.2)}
.pn-badge-role{background:rgba(245,158,11,.12);color:var(--accent);border:1px solid rgba(245,158,11,.2);font-size:11px;font-weight:600;padding:2px 10px;border-radius:100px;text-transform:capitalize}
.pn-root[data-theme="light"] .pn-badge-success{background:rgba(22,163,74,.1);border-color:rgba(22,163,74,.2)}
.pn-root[data-theme="light"] .pn-badge-accent{background:rgba(217,119,6,.1);border-color:rgba(217,119,6,.2)}
.pn-root[data-theme="light"] .pn-badge-role{background:rgba(217,119,6,.1);border-color:rgba(217,119,6,.2)}
.pn-balance-badge{background:rgba(34,197,94,.1);color:var(--success);border:1px solid rgba(34,197,94,.2);font-family:'Geist Mono','Courier New',monospace;font-size:11px;font-weight:500;padding:2px 10px;border-radius:100px}

/* Tags */
.pn-tag{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:100px;font-size:10px;font-weight:500;background:var(--tag-bg);color:var(--tag-text)}

/* Quick actions */
.pn-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.pn-action-pill{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:100px;font-size:13px;font-weight:500;cursor:pointer;transition:all 150ms ease;border:1.5px solid var(--accent);background:transparent;color:var(--accent);font-family:'Plus Jakarta Sans',sans-serif}
.pn-action-pill:hover{background:var(--accent);color:var(--accent-text)}
.pn-action-pill:active{transform:scale(.97)}

/* Platform chips */
.pn-chips-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px;scrollbar-width:none}
.pn-chips-scroll::-webkit-scrollbar{display:none}
.pn-pchip{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border-radius:100px;font-size:13px;font-weight:500;cursor:pointer;transition:all 150ms ease;background:var(--bg-raised);border:1px solid var(--border);color:var(--text-secondary);white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif}
.pn-pchip:hover{border-color:var(--border-strong);color:var(--text-primary)}
.pn-pchip.active{background:var(--chip-active-bg);color:var(--chip-active-text);border-color:var(--chip-active-bg)}

/* Custom dropdown */
.pn-dd-wrap{position:relative;margin-bottom:14px}
.pn-dd-trigger{width:100%;height:44px;background:var(--bg-input);border:1px solid var(--border);border-radius:10px;padding:0 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all 150ms ease;font-family:'Plus Jakarta Sans',sans-serif;color:var(--text-primary);font-size:14px}
.pn-dd-trigger:hover,.pn-dd-trigger.open{border-color:var(--accent);box-shadow:0 0 0 2px rgba(245,158,11,.15)}
.pn-dd-arrow{margin-left:auto;color:var(--text-muted);font-size:16px;transition:transform 150ms ease}
.pn-dd-trigger.open .pn-dd-arrow{transform:rotate(180deg)}
.pn-dd-panel{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--bg-surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-md);z-index:50;max-height:300px;overflow-y:auto;scrollbar-width:none}
.pn-dd-panel::-webkit-scrollbar{display:none}
.pn-dd-item{display:flex;align-items:center;gap:12px;padding:11px 14px;cursor:pointer;transition:all 150ms ease;border-left:2px solid transparent}
.pn-dd-item:hover{background:var(--bg-raised);border-left-color:var(--accent)}
.pn-dd-item.selected{background:rgba(245,158,11,.06);border-left-color:var(--accent)}
.pn-root[data-theme="light"] .pn-dd-item.selected{background:rgba(217,119,6,.05)}
.pn-dd-item-center{flex:1;min-width:0}
.pn-dd-item-name{font-size:13px;font-weight:500;color:var(--text-primary);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pn-dd-tags{display:flex;gap:4px;flex-wrap:wrap}
.pn-dd-price{font-family:'Geist Mono','Courier New',monospace;font-size:13px;color:var(--accent);font-weight:500;flex-shrink:0}
.pn-qdot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.pn-qdot.high{background:var(--success)}
.pn-qdot.medium{background:var(--accent)}
.pn-qdot.low{background:var(--danger)}

/* Qty stepper */
.pn-qty{display:flex;align-items:center;height:44px;border:1px solid var(--border);border-radius:10px;background:var(--bg-input);overflow:hidden}
.pn-qty-btn{width:40px;height:100%;background:var(--bg-raised);border:none;cursor:pointer;font-size:18px;color:var(--text-secondary);transition:all 150ms ease;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pn-qty-btn:hover{background:var(--border);color:var(--text-primary)}
.pn-qty-input{flex:1;height:100%;border:none;background:transparent;text-align:center;font-family:'Geist Mono','Courier New',monospace;font-size:15px;font-weight:500;color:var(--text-primary);outline:none}

/* Cost calc */
.pn-cost-box{background:var(--bg-raised);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:14px}
.pn-cost-label{font-size:12px;color:var(--text-muted);margin-bottom:4px}
.pn-cost-value{font-family:'Geist Mono','Courier New',monospace;font-size:24px;font-weight:500;color:var(--accent)}

/* Order summary */
.pn-summary{background:var(--bg-raised);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px}
.pn-summary-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;font-size:13px}
.pn-summary-row:not(:last-child){border-bottom:0.5px solid var(--border)}
.pn-summary-label{color:var(--text-muted)}
.pn-summary-value{font-weight:500;color:var(--text-primary)}
.pn-summary-total .pn-summary-value{font-family:'Geist Mono','Courier New',monospace;color:var(--accent);font-size:16px;font-weight:600}

/* SMS grid */
.pn-sms-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.pn-sms-tile{background:var(--bg-surface);border:1px solid var(--border);border-radius:14px;padding:14px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all 150ms ease;min-height:72px;font-family:'Plus Jakarta Sans',sans-serif}
.pn-sms-tile:hover{border-color:var(--accent);background:var(--bg-raised)}
.pn-sms-tile.active{border-color:var(--accent);background:rgba(245,158,11,.06)}
.pn-root[data-theme="light"] .pn-sms-tile.active{background:rgba(217,119,6,.05)}
.pn-sms-tile-name{font-size:11px;font-weight:500;color:var(--text-secondary)}
.pn-sms-tile.active .pn-sms-tile-name{color:var(--accent);font-weight:600}

/* Amount chips grid */
.pn-amount-chips{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.pn-achip{height:40px;background:var(--bg-raised);border:1px solid var(--border);border-radius:10px;font-size:13px;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:all 150ms ease;font-family:'Plus Jakarta Sans',sans-serif}
.pn-achip:hover{border-color:var(--border-strong);color:var(--text-primary)}
.pn-achip.selected{background:rgba(245,158,11,.1);border-color:var(--accent);color:var(--accent);font-weight:600}
.pn-root[data-theme="light"] .pn-achip.selected{background:rgba(217,119,6,.08)}

/* Add funds cards */
.pn-send-exactly{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:14px}
.pn-root[data-theme="light"] .pn-send-exactly{background:rgba(217,119,6,.06);border-color:rgba(217,119,6,.2)}
.pn-se-label{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--accent);margin-bottom:6px}
.pn-se-amount{font-family:'Geist Mono','Courier New',monospace;font-size:28px;font-weight:500;color:var(--text-primary)}
.pn-bank-card{background:var(--bg-raised);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px}
.pn-bank-name{font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px}
.pn-bank-number{font-family:'Geist Mono','Courier New',monospace;font-size:20px;font-weight:500;color:var(--text-primary);letter-spacing:.05em;margin-bottom:3px}
.pn-bank-acct{font-size:13px;color:var(--text-secondary);font-weight:500}
.pn-narration{background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:14px 16px;margin-bottom:10px;position:relative}
.pn-root[data-theme="light"] .pn-narration{background:rgba(22,163,74,.05);border-color:rgba(22,163,74,.15)}
.pn-narration-lbl{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--success);margin-bottom:8px}
.pn-narration-code{font-family:'Geist Mono','Courier New',monospace;font-size:20px;font-weight:500;color:var(--success);letter-spacing:.06em}
.pn-copy-btn{position:absolute;top:12px;right:12px;background:none;border:none;cursor:pointer;color:var(--success);font-size:16px;padding:4px;border-radius:6px;transition:background 150ms ease;display:flex;align-items:center}
.pn-copy-btn:hover{background:rgba(34,197,94,.12)}
.pn-info-box{background:var(--bg-raised);border:1px solid var(--border);border-radius:10px;padding:12px 14px;font-size:12px;color:var(--text-secondary);line-height:1.6;margin-bottom:14px}
.pn-step-label{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--accent);margin-bottom:4px;display:block}

/* Tabs */
.pn-tabs{display:flex;background:var(--bg-raised);border-radius:12px;padding:4px;gap:4px;margin-bottom:20px}
.pn-tabs.gold-active .pn-tab.active{background:var(--accent);border-color:var(--accent);color:var(--accent-text)}
.pn-tab{flex:1;height:36px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;transition:all 150ms ease;background:transparent;border:none;color:var(--text-muted);font-family:'Plus Jakarta Sans',sans-serif}
.pn-tab:hover{color:var(--text-secondary)}
.pn-tab.active{background:var(--bg-surface);border:1px solid var(--border);color:var(--text-primary);font-weight:600;box-shadow:var(--shadow-sm)}

/* Rows */
.pn-tx-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;gap:12px;border-bottom:0.5px solid var(--border)}
.pn-tx-row:last-child{border-bottom:none}
.pn-tx-desc{font-size:13px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.pn-tx-date{font-size:11px;color:var(--text-muted);margin-top:2px}
.pn-tx-pos{font-family:'Geist Mono','Courier New',monospace;font-size:14px;font-weight:500;color:var(--success)}
.pn-tx-neg{font-family:'Geist Mono','Courier New',monospace;font-size:14px;font-weight:500;color:var(--danger)}

/* Order rows */
.pn-order-header{display:grid;grid-template-columns:80px 60px 1fr 70px;gap:10px;padding:10px 16px;background:var(--bg-raised);border-bottom:1px solid var(--border);border-radius:16px 16px 0 0}
.pn-order-header span{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted)}
.pn-order-header span:last-child{text-align:right}
.pn-order-row{display:grid;grid-template-columns:80px 60px 1fr 70px;align-items:center;gap:10px;padding:12px 16px;border-bottom:0.5px solid var(--border);transition:background 150ms ease}
.pn-order-row:last-child{border-bottom:none}
.pn-order-row:hover{background:var(--bg-raised)}
.pn-order-id{font-family:'Geist Mono','Courier New',monospace;font-size:11px;color:var(--text-muted)}
.pn-order-qty{font-family:'Geist Mono','Courier New',monospace;font-size:12px;color:var(--accent);text-align:right;font-weight:500}
.pn-order-name{font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pn-order-sub{font-size:11px;color:var(--text-muted);font-family:'Geist Mono','Courier New',monospace;margin-top:2px}

/* Section header row */
.pn-hrow{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}

/* Profile */
.pn-profile-head{text-align:center;padding:24px 20px 20px;border-bottom:1px solid var(--border);margin-bottom:20px}
.pn-profile-name{font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:4px}
.pn-profile-email{font-size:13px;color:var(--text-muted);margin-bottom:12px}
.pn-meta-badges{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}

/* Theme toggle */
.pn-theme-toggle{display:flex;background:var(--bg-raised);border-radius:12px;padding:4px;gap:4px;margin-bottom:20px}
.pn-topt{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;height:36px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;transition:all 150ms ease;background:transparent;border:none;color:var(--text-muted);font-family:'Plus Jakarta Sans',sans-serif}
.pn-topt:hover{color:var(--text-secondary)}
.pn-topt.active{background:var(--bg-surface);border:1px solid var(--border);color:var(--text-primary);font-weight:600;box-shadow:var(--shadow-sm)}

/* Divider */
.pn-divider{height:0.5px;background:var(--border);margin:16px 0}

/* Empty state */
.pn-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center}
.pn-empty-icon{font-size:36px;color:var(--text-muted);margin-bottom:12px}
.pn-empty-title{font-size:15px;font-weight:600;color:var(--text-secondary);margin-bottom:6px}
.pn-empty-sub{font-size:13px;color:var(--text-muted)}

/* Drawer overlay */
.pn-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:190;opacity:0;pointer-events:none;transition:opacity 200ms ease}
.pn-overlay.show{opacity:1;pointer-events:all}
.pn-sidebar.drawer{transform:translateX(-100%);transition:transform 220ms ease}
.pn-sidebar.drawer.open{transform:translateX(0)}

/* Bottom nav */
.pn-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:64px;background:var(--bg-surface);border-top:1px solid var(--border);z-index:100}
.pn-bnav-items{display:flex;align-items:center;justify-content:space-around;height:100%;padding:0 8px}
.pn-bnav-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 12px;border-radius:10px;cursor:pointer;transition:all 150ms ease;color:var(--text-muted);background:none;border:none;font-family:'Plus Jakarta Sans',sans-serif;flex:1}
.pn-bnav-item .ti{font-size:22px}
.pn-bnav-item span{font-size:10px;font-weight:500}
.pn-bnav-item.active{color:var(--accent)}

/* Greeting */
.pn-greeting{margin-bottom:20px}
.pn-greeting-title{font-size:24px;font-weight:600;color:var(--text-primary);margin-bottom:4px}
.pn-greeting-sub{font-size:14px;color:var(--text-secondary)}

/* Mono utility */
.pn-mono{font-family:'Geist Mono','Courier New',monospace;font-variant-numeric:tabular-nums}

/* Section gap */
.pn-section{margin-bottom:20px}

/* Balance big card */
.pn-balance-hero{background:var(--bg-raised);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px}
.pn-balance-hero-label{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px}
.pn-balance-hero-amount{font-family:'Geist Mono','Courier New',monospace;font-size:32px;font-weight:500;color:var(--accent)}

/* Responsive */
@media (max-width:768px){
  .pn-sidebar{display:none}
  .pn-sidebar.show,.pn-sidebar.drawer{display:flex}
  .pn-main{margin-left:0}
  .pn-bottom-nav{display:block}
  .pn-content{padding:16px 16px 80px}
  .pn-topbar{padding:0 16px}
  .pn-hamburger{display:flex!important}
  .pn-stat-grid{grid-template-columns:1fr 1fr}
  .pn-sms-grid{grid-template-columns:repeat(3,1fr)}
  .pn-order-header,.pn-order-row{grid-template-columns:70px 55px 1fr 60px;gap:6px;padding:10px 12px}
}
@media (min-width:769px){
  .pn-hamburger{display:none!important}
}
`;

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ onMenuClick }) {
  const { theme, setTheme } = useContext(ThemeCtx);
  const [showTip, setShowTip] = useState(false);
  const cycle = () => { const m = ['light','dark','system']; setTheme(m[(m.indexOf(theme)+1)%3]); };
  const icons = { light: 'ti-sun', dark: 'ti-moon', system: 'ti-device-laptop' };
  const labels = { light: 'Light mode', dark: 'Dark mode', system: 'System mode' };
  return (
    <header className="pn-topbar">
      <button className="pn-hamburger" onClick={onMenuClick}><i className="ti ti-menu-2"/></button>
      <div className="pn-topbar-brand">
        <div className="pn-brand-mark">P</div>
        <span className="pn-brand-name">PanelNG</span>
      </div>
      <div style={{position:'relative'}} onMouseEnter={()=>setShowTip(true)} onMouseLeave={()=>setShowTip(false)}>
        <button className="pn-theme-icon-btn" onClick={cycle}><i className={`ti ${icons[theme]}`}/></button>
        {showTip && <div className="pn-tooltip">{labels[theme]}</div>}
      </div>
      <div className="pn-balance-chip">
        <span className="pn-balance-chip-label">Balance</span>
        <span className="pn-balance-chip-amount">{fmt(MOCK.user.balance)}</span>
      </div>
    </header>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, isOpen, onClose, isMobile }) {
  const NAV = [
    { id:'overview', icon:'ti-home', label:'Overview' },
    { id:'neworder', icon:'ti-circle-plus', label:'New SMM Order' },
    { id:'sms', icon:'ti-device-mobile', label:'SMS Verify' },
    { id:'accounts', icon:'ti-shopping-bag', label:'Buy Accounts' },
    { id:'orders', icon:'ti-receipt', label:'Order History' },
    { id:'funds', icon:'ti-wallet', label:'Add Funds' },
    { id:'profile', icon:'ti-user-circle', label:'Profile' },
  ];
  return (
    <aside className={`pn-sidebar${isMobile ? ' drawer' + (isOpen ? ' open' : '') : ''}`}>
      <div className="pn-sidebar-brand">
        <div className="pn-brand-mark">P</div>
        <span className="pn-brand-name">PanelNG</span>
        {isMobile && <button className="pn-close-btn" onClick={onClose}><i className="ti ti-x"/></button>}
      </div>
      <div className="pn-sidebar-wallet">
        <div className="pn-wallet-label">Wallet Balance</div>
        <div className="pn-wallet-amount">{fmt(MOCK.user.balance)}</div>
      </div>
      <nav className="pn-sidebar-nav">
        <div className="pn-nav-label">Menu</div>
        {NAV.map(n => (
          <button key={n.id} className={`pn-nav-item${page===n.id?' active':''}`} onClick={()=>setPage(n.id)}>
            <i className={`ti ${n.icon}`}/>{n.label}
          </button>
        ))}
      </nav>
      <div className="pn-sidebar-footer">
        <div className="pn-user-card">
          <div className="pn-avatar">{MOCK.user.initials}</div>
          <div>
            <div className="pn-user-name">{MOCK.user.name}</div>
            <div className="pn-user-role">{MOCK.user.role}</div>
          </div>
        </div>
        <button className="pn-btn-signout"><i className="ti ti-logout"/>Sign Out</button>
      </div>
    </aside>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ page, setPage }) {
  const items = [
    { id:'overview', icon:'ti-home', label:'Home' },
    { id:'neworder', icon:'ti-circle-plus', label:'Order' },
    { id:'accounts', icon:'ti-shopping-bag', label:'Accounts' },
    { id:'sms', icon:'ti-device-mobile', label:'SMS' },
    { id:'funds', icon:'ti-wallet', label:'Funds' },
  ];
  return (
    <nav className="pn-bottom-nav">
      <div className="pn-bnav-items">
        {items.map(i => (
          <button key={i.id} className={`pn-bnav-item${page===i.id?' active':''}`} onClick={()=>setPage(i.id)}>
            <i className={`ti ${i.icon}`}/><span>{i.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── PAGE: OVERVIEW ───────────────────────────────────────────────────────────
function Overview({ setPage }) {
  return (
    <div>
      <div className="pn-greeting">
        <div className="pn-greeting-title">{greet()}, {MOCK.user.name.split(' ')[0]} 👋</div>
        <div className="pn-greeting-sub">Here's what's happening on your account today.</div>
      </div>
      <div className="pn-stat-grid">
        <div className="pn-stat-card full">
          <div className="pn-stat-icon accent"><i className="ti ti-wallet"/></div>
          <div className="pn-stat-label">Wallet Balance</div>
          <div className="pn-stat-value accent">{fmt(MOCK.user.balance)}</div>
        </div>
        <div className="pn-stat-card">
          <div className="pn-stat-icon success"><i className="ti ti-shopping-cart"/></div>
          <div className="pn-stat-label">Total Orders</div>
          <div className="pn-stat-value">{MOCK.user.totalOrders}</div>
        </div>
        <div className="pn-stat-card">
          <div className="pn-stat-icon info"><i className="ti ti-trending-down"/></div>
          <div className="pn-stat-label">Total Spent</div>
          <div className="pn-stat-value">{fmt(MOCK.user.totalSpent)}</div>
        </div>
      </div>
      <div className="pn-actions">
        <button className="pn-action-pill" onClick={()=>setPage('neworder')}><i className="ti ti-circle-plus"/>New SMM Order</button>
        <button className="pn-action-pill" onClick={()=>setPage('sms')}><i className="ti ti-device-mobile"/>Buy SMS Number</button>
        <button className="pn-action-pill" onClick={()=>setPage('accounts')}><i className="ti ti-shopping-bag"/>Buy Accounts</button>
        <button className="pn-action-pill" onClick={()=>setPage('funds')}><i className="ti ti-wallet"/>Add Funds</button>
      </div>
      <div className="pn-section">
        <div className="pn-hrow">
          <span className="pn-section-label" style={{marginBottom:0}}>Recent Orders</span>
          <button className="pn-btn pn-btn-ghost pn-btn-sm" onClick={()=>setPage('orders')}>View all <i className="ti ti-arrow-right"/></button>
        </div>
        <div className="pn-card" style={{padding:0,overflow:'hidden'}}>
          {MOCK.orders.length === 0 ? (
            <div className="pn-empty"><i className="ti ti-receipt pn-empty-icon"/><div className="pn-empty-title">No orders yet</div></div>
          ) : MOCK.orders.map((o,i) => (
            <div key={o.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 18px',borderBottom:i<MOCK.orders.length-1?'0.5px solid var(--border)':'none',gap:12}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginBottom:3}}>{o.type==='accounts'?(o.product_name||o.platform):`${o.platform} • ${o.country}`}</div>
                <div className="pn-mono" style={{fontSize:11,color:'var(--text-muted)'}}>{o.type==='accounts'?`${o.quantity} account${o.quantity>1?'s':''}`:o.phone}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                <div className="pn-mono" style={{fontSize:12,color:'var(--danger)'}}>{fmt(o.amount)}</div>
                <Badge status={o.status}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pn-section">
        <div className="pn-hrow">
          <span className="pn-section-label" style={{marginBottom:0}}>Recent Transactions</span>
          <button className="pn-btn pn-btn-ghost pn-btn-sm" onClick={()=>setPage('funds')}>Add Funds <i className="ti ti-arrow-right"/></button>
        </div>
        <div className="pn-card" style={{padding:'0 20px'}}>
          {MOCK.transactions.map((t,i) => (
            <div key={i} className="pn-tx-row">
              <div style={{minWidth:0}}>
                <div className="pn-tx-desc">{t.desc}</div>
                <div className="pn-tx-date">{t.date}</div>
              </div>
              <span className={t.amount>=0?'pn-tx-pos':'pn-tx-neg'}>{t.amount>=0?'+':''}{fmt(Math.abs(t.amount))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE DROPDOWN ────────────────────────────────────────────────────────
function ServiceDropdown({ services, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = services.find(s => s.id === value);
  const platform = selected ? (selected.id.startsWith('fb')?'Facebook':selected.id.startsWith('ig')?'Instagram':selected.id.startsWith('tt')?'TikTok':selected.id.startsWith('yt')?'YouTube':selected.id.startsWith('tw')?'Twitter':selected.id.startsWith('tg')?'Telegram':'Spotify') : null;
  return (
    <div className="pn-dd-wrap" ref={ref}>
      <div className={`pn-dd-trigger${open?' open':''}`} onClick={()=>setOpen(!open)}>
        {selected ? (
          <>
            {platform && <PlatformIcon name={platform} size={18}/>}
            <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected.name}</span>
            <span className="pn-mono" style={{fontSize:12,color:'var(--accent)',flexShrink:0}}>₦{selected.rate}/1k</span>
          </>
        ) : (
          <span style={{color:'var(--text-muted)',flex:1}}>— Choose a service —</span>
        )}
        <i className="ti ti-chevron-down pn-dd-arrow"/>
      </div>
      {open && (
        <div className="pn-dd-panel">
          {services.map(s => {
            const plat = s.id.startsWith('fb')?'Facebook':s.id.startsWith('ig')?'Instagram':s.id.startsWith('tt')?'TikTok':s.id.startsWith('yt')?'YouTube':s.id.startsWith('tw')?'Twitter':s.id.startsWith('tg')?'Telegram':'Spotify';
            return (
              <div key={s.id} className={`pn-dd-item${value===s.id?' selected':''}`} onClick={()=>{onChange(s.id);setOpen(false);}}>
                <PlatformIcon name={plat} size={20}/>
                <div className="pn-dd-item-center">
                  <div className="pn-dd-item-name">{s.name}</div>
                  <div className="pn-dd-tags">{s.tags.map(t=><span key={t} className="pn-tag">{t}</span>)}</div>
                </div>
                <div className="pn-qdot" style={{marginRight:4}} data-q={s.quality}><div className={`pn-qdot ${s.quality}`}/></div>
                <div className="pn-dd-price">₦{s.rate}/1k</div>
                {value===s.id && <i className="ti ti-check" style={{color:'var(--accent)',fontSize:14}}/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PAGE: NEW ORDER ──────────────────────────────────────────────────────────
function NewOrder() {
  const [platform, setPlatform] = useState('All');
  const [serviceId, setServiceId] = useState('');
  const [link, setLink] = useState('');
  const [qty, setQty] = useState(1000);
  const [placed, setPlaced] = useState(false);
  const services = platform === 'All' ? ALL_SERVICES : (MOCK.services[platform] || []);
  const selected = ALL_SERVICES.find(s => s.id === serviceId);
  const cost = selected && qty > 0 ? (selected.rate * qty) / 1000 : 0;
  const handlePlace = () => { if (!serviceId || !link || qty < 1) return; setPlaced(true); setTimeout(()=>setPlaced(false),3000); };
  return (
    <div>
      <div className="pn-page-title">New SMM Order</div>
      <div className="pn-page-sub">Pick a platform, choose a service, and grow your reach.</div>
      {placed && (
        <div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10,fontSize:13}}>
          <i className="ti ti-circle-check" style={{color:'var(--success)',fontSize:18}}/><span style={{color:'var(--text-secondary)'}}>Order placed successfully! Check your Order History.</span>
        </div>
      )}
      <div className="pn-chips-scroll">
        {PLATFORMS.map(p => (
          <button key={p} className={`pn-pchip${platform===p?' active':''}`} onClick={()=>{setPlatform(p);setServiceId('');}}>
            {p!=='All'&&<PlatformIcon name={p} size={14}/>}{p}
          </button>
        ))}
      </div>
      <div className="pn-card">
        <div className="pn-input-wrap">
          <label className="pn-input-label">Service</label>
          <ServiceDropdown services={services} value={serviceId} onChange={setServiceId}/>
        </div>
        <div className="pn-input-wrap">
          <label className="pn-input-label">Target Link or Username</label>
          <div className="pn-input-with-icon">
            <i className="ti ti-link pn-input-icon"/>
            <input className="pn-input" placeholder="https://instagram.com/yourpage" value={link} onChange={e=>setLink(e.target.value)}/>
          </div>
        </div>
        <div className="pn-input-wrap">
          <label className="pn-input-label">
            Quantity {selected && <span style={{color:'var(--text-muted)',fontWeight:400}}> ({selected.min.toLocaleString()} – {selected.max.toLocaleString()})</span>}
          </label>
          <div className="pn-qty">
            <button className="pn-qty-btn" onClick={()=>setQty(q=>Math.max(1,q-100))}>−</button>
            <input className="pn-qty-input" type="number" value={qty} onChange={e=>setQty(Number(e.target.value)||0)} min={selected?.min||1} max={selected?.max||9999999}/>
            <button className="pn-qty-btn" onClick={()=>setQty(q=>q+100)}>+</button>
          </div>
        </div>
        {cost > 0 && (
          <>
            <div className="pn-cost-box">
              <div className="pn-cost-label">Estimated cost</div>
              <div className="pn-cost-value">{fmt(cost)}</div>
            </div>
            <div className="pn-summary">
              <div className="pn-summary-row"><span className="pn-summary-label">Service</span><span className="pn-summary-value" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected?.name}</span></div>
              <div className="pn-summary-row"><span className="pn-summary-label">Quantity</span><span className="pn-summary-value pn-mono">{qty.toLocaleString()}</span></div>
              <div className="pn-summary-row"><span className="pn-summary-label">Rate</span><span className="pn-summary-value pn-mono">₦{selected?.rate}/1k</span></div>
              <div className="pn-summary-row pn-summary-total"><span className="pn-summary-label">Total</span><span className="pn-summary-value">{fmt(cost)}</span></div>
            </div>
          </>
        )}
        <button className="pn-btn pn-btn-primary pn-btn-full" onClick={handlePlace} disabled={!serviceId||!link||qty<1} style={{opacity:(!serviceId||!link||qty<1)?.5:1}}>
          <i className="ti ti-shopping-cart"/>Place Order →
        </button>
      </div>
    </div>
  );
}

// ─── PAGE: SMS VERIFY ─────────────────────────────────────────────────────────
function SmsVerify() {
  const [app, setApp] = useState('');
  const [country, setCountry] = useState('');
  const [active, setActive] = useState(null);
  const [code, setCode] = useState('');
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const COUNTRIES = ['Nigeria (+234)', 'United States (+1)', 'United Kingdom (+44)', 'South Africa (+27)', 'Canada (+1)', 'Ghana (+233)', 'Kenya (+254)', 'Russia (+7)', 'India (+91)', 'Germany (+49)'];
  const handleGet = () => {
    if (!app || !country) return;
    setActive({ number: '+234' + Math.floor(7000000000 + Math.random()*999999999), app, country });
    setCode('');
    setPolling(true);
    setTimeout(() => { setCode(String(Math.floor(100000 + Math.random()*900000))); setPolling(false); }, 4000);
  };
  const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div>
      <div className="pn-page-title">SMS Verify</div>
      <div className="pn-page-sub">Virtual numbers for any platform. Code arrives automatically.</div>
      <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:10,padding:'6px 12px',marginBottom:20}}>
        <i className="ti ti-wallet" style={{color:'var(--accent)',fontSize:14}}/>
        <div>
          <div style={{fontFamily:'Geist Mono',fontSize:9,textTransform:'uppercase',letterSpacing:1,color:'var(--accent)',lineHeight:1}}>Balance</div>
          <div className="pn-mono" style={{fontSize:14,color:'var(--accent)'}}>{fmt(MOCK.user.balance)}</div>
        </div>
      </div>
      {active && (
        <div style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.2)',borderRadius:16,padding:20,marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',color:'var(--success)',marginBottom:14}}>Active Number — {active.app}</div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
            <div className="pn-mono" style={{fontSize:24,color:'var(--text-primary)',flex:1}}>{active.number}</div>
            <button onClick={()=>handleCopy(active.number)} style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',borderRadius:8,padding:'8px 12px',cursor:'pointer',color:'var(--success)',display:'flex',alignItems:'center'}}>
              <i className="ti ti-copy"/>
            </button>
          </div>
          {code ? (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:1,textTransform:'uppercase',color:'var(--success)',marginBottom:8}}>Verification Code</div>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div className="pn-mono" style={{fontSize:36,color:'var(--text-primary)',letterSpacing:'0.12em'}}>{code}</div>
                <button className="pn-btn pn-btn-primary pn-btn-sm" onClick={()=>handleCopy(code)}><i className={`ti ${copied?'ti-check':'ti-copy'}`}/>Copy</button>
              </div>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--text-secondary)',fontSize:13,marginBottom:16}}>
              <i className="ti ti-loader-2" style={{color:'var(--success)',animation:'spin 1s linear infinite'}}/>
              Waiting for SMS code…
            </div>
          )}
          <div style={{display:'flex',gap:10}}>
            <button className="pn-btn pn-btn-success" style={{flex:1}} onClick={()=>{setActive(null);setCode('');setPolling(false);}}><i className="ti ti-check"/>Done</button>
            <button className="pn-btn pn-btn-secondary" style={{flex:1,color:'var(--danger)',borderColor:'rgba(248,113,113,.25)'}} onClick={()=>{setActive(null);setCode('');setPolling(false);}}><i className="ti ti-x"/>Cancel</button>
          </div>
        </div>
      )}
      {!active && (
        <>
          <span className="pn-section-label">1 — Pick an App</span>
          <div className="pn-sms-grid">
            {SMS_APPS.map(a => (
              <button key={a} className={`pn-sms-tile${app===a?' active':''}`} onClick={()=>setApp(a)}>
                <PlatformIcon name={a} size={28}/>
                <span className="pn-sms-tile-name">{a}</span>
              </button>
            ))}
          </div>
          {app && (
            <div className="pn-card">
              <span className="pn-section-label">2 — Select Country</span>
              <div className="pn-input-wrap">
                <select className="pn-input" value={country} onChange={e=>setCountry(e.target.value)} style={{cursor:'pointer'}}>
                  <option value="">— Select a country —</option>
                  {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button className="pn-btn pn-btn-primary pn-btn-full" onClick={handleGet} disabled={!country} style={{opacity:!country?.5:1}}>
                <i className="ti ti-device-mobile"/>Get Number for {app}
              </button>
            </div>
          )}
          {!app && (
            <div className="pn-empty">
              <i className="ti ti-message-circle pn-empty-icon"/>
              <div className="pn-empty-title">Pick an app above</div>
              <div className="pn-empty-sub">Select a platform to see available numbers and prices</div>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── PAGE: ORDER HISTORY ──────────────────────────────────────────────────────
function OrderHistory() {
  const [tab, setTab] = useState('all');
  const orders = tab === 'all' ? MOCK.orders : MOCK.orders.filter(o=>o.type===tab);
  const [viewAccOrder, setViewAccOrder] = useState(null);
  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,gap:12}}>
        <div>
          <div className="pn-page-title">Order History</div>
          <div className="pn-page-sub" style={{marginBottom:0}}>{MOCK.orders.length} total orders</div>
        </div>
        <button className="pn-btn pn-btn-secondary pn-btn-sm"><i className="ti ti-refresh"/>Refresh</button>
      </div>
      <div className="pn-tabs">
        {[['all','All'],['smm','SMM'],['sms','SMS'],['accounts','Accounts']].map(([v,l])=>(
          <button key={v} className={`pn-tab${tab===v?' active':''}`} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>
      {orders.length === 0 ? (
        <div className="pn-card"><div className="pn-empty"><i className="ti ti-receipt pn-empty-icon"/><div className="pn-empty-title">No orders found</div><div className="pn-empty-sub">Place your first order to see it here</div></div></div>
      ) : (
        <div className="pn-card" style={{padding:0,overflow:'hidden'}}>
          <div className="pn-order-header">
            <span>Order ID</span><span>Type</span><span>Service / Platform</span><span style={{textAlign:'right'}}>Amount</span>
          </div>
          {orders.map(o => (
            <div key={o.id} className="pn-order-row">
              <div className="pn-order-id">{o.id.slice(0,8)}</div>
              <div><Badge type={o.type}/></div>
              <div>
                <div className="pn-order-name" style={{display:'flex',alignItems:'center',gap:6}}><PlatformIcon name={o.platform} size={14}/>{o.type==='accounts'?(o.product_name||o.platform):o.platform}</div>
                <div className="pn-order-sub">{o.type==='accounts'?`${o.quantity} account${(o.quantity||1)>1?'s':''}`:`${o.phone||''} · ${o.country||''}`}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                <div className="pn-order-qty">{fmt(o.amount)}</div>
                {o.type==='accounts'
                  ? <button className="pn-btn pn-btn-ghost pn-btn-sm" style={{fontSize:10,height:24,padding:'0 8px'}} onClick={()=>setViewAccOrder(o)}>View</button>
                  : <Badge status={o.status}/>
                }
              </div>
            </div>
          ))}
        </div>
      )}
      {viewAccOrder && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:20,width:'100%',maxWidth:420,padding:24}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)'}}>Account Order Details</div>
              <button onClick={()=>setViewAccOrder(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:18}}><i className="ti ti-x"/></button>
            </div>
            <div style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:12,padding:'4px 16px',marginBottom:16}}>
              {[['Product',viewAccOrder.product_name||viewAccOrder.platform],['Quantity',String(viewAccOrder.quantity||1)],['Total',fmt(viewAccOrder.amount)],['Status',viewAccOrder.status]].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'0.5px solid var(--border)',fontSize:13}}>
                  <span style={{color:'var(--text-muted)'}}>{l}</span>
                  <span style={{fontWeight:500,color:'var(--text-primary)',fontFamily:l==='Total'?"'Geist Mono','Courier New',monospace":'inherit'}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',lineHeight:1.6}}>Account credentials were shown at the time of purchase.<br/>Contact support if you need assistance.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE: ADD FUNDS ──────────────────────────────────────────────────────────
function AddFunds() {
  const [tab, setTab] = useState('bank');
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [selectedAmt, setSelectedAmt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const REF = 'PNG-4625-ADE';
  const QUICK = [500, 1000, 2000, 5000, 10000, 20000];
  const selectAmt = (a) => { setAmount(String(a)); setSelectedAmt(a); };
  const handleCopy = () => { navigator.clipboard.writeText(REF); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div>
      <div className="pn-page-title">Add Funds</div>
      <div className="pn-page-sub">Fund your wallet to place orders instantly.</div>
      <div className="pn-balance-hero">
        <div className="pn-balance-hero-label">Current Balance</div>
        <div className="pn-balance-hero-amount">{fmt(MOCK.user.balance)}</div>
      </div>
      <div className="pn-tabs pn-tabs gold-active">
        {[['bank','Bank Transfer'],['paystack','Paystack']].map(([v,l])=>(
          <button key={v} className={`pn-tab${tab===v?' active':''}`} onClick={()=>{setTab(v);setStep(1);setAmount('');setSelectedAmt(null);setSubmitted(false);}}>
            <i className={`ti ${v==='bank'?'ti-building-bank':'ti-credit-card'}`}/>{l}
          </button>
        ))}
      </div>
      {tab === 'bank' && (
        <div className="pn-card">
          {step === 1 && (
            <>
              <span className="pn-step-label">Step 1 — Enter Amount</span>
              <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:16,marginTop:4}}>We'll generate a unique reference code for your transfer.</p>
              <div className="pn-input-wrap">
                <label className="pn-input-label">Amount (₦)</label>
                <div className="pn-input-with-icon">
                  <span className="pn-input-icon pn-mono" style={{fontWeight:500}}>₦</span>
                  <input className="pn-input pn-mono" style={{paddingLeft:30,fontSize:18}} type="number" placeholder="0.00" value={amount} onChange={e=>{setAmount(e.target.value);setSelectedAmt(null);}} min={100}/>
                </div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Minimum: ₦100</div>
              </div>
              <label className="pn-input-label">Quick Amounts</label>
              <div className="pn-amount-chips">
                {QUICK.map(a=>(
                  <button key={a} className={`pn-achip${selectedAmt===a?' selected':''}`} onClick={()=>selectAmt(a)}>₦{a.toLocaleString()}</button>
                ))}
              </div>
              <button className="pn-btn pn-btn-primary pn-btn-full" onClick={()=>{if(parseFloat(amount)>=100)setStep(2);}} disabled={!amount||parseFloat(amount)<100} style={{opacity:(!amount||parseFloat(amount)<100)?.5:1}}>
                Get Payment Details <i className="ti ti-arrow-right"/>
              </button>
            </>
          )}
          {step === 2 && !submitted && (
            <>
              <span className="pn-step-label">Step 2 — Make the Transfer</span>
              <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:16,marginTop:4}}>Use these exact details when sending your transfer.</p>
              <div className="pn-send-exactly">
                <div className="pn-se-label">Send Exactly</div>
                <div className="pn-se-amount">{fmt(parseFloat(amount))}</div>
              </div>
              {MOCK.bankDetails.map(b=>(
                <div key={b.bank} className="pn-bank-card">
                  <div className="pn-bank-name">{b.bank}</div>
                  <div className="pn-bank-number">{b.number}</div>
                  <div className="pn-bank-acct">{b.name}</div>
                </div>
              ))}
              <div className="pn-narration">
                <div className="pn-narration-lbl">Transfer Narration / Description</div>
                <div className="pn-narration-code">{REF}</div>
                <button className="pn-copy-btn" onClick={handleCopy}><i className={`ti ${copied?'ti-check':'ti-copy'}`}/></button>
                <div style={{fontSize:11,color:'var(--success)',marginTop:8,opacity:.75}}>Use this exact code as your transfer narration — it's how we match your payment.</div>
              </div>
              <div className="pn-info-box">After sending, click the button below. We'll credit your wallet once we confirm the transfer — usually within minutes during business hours.</div>
              <button className="pn-btn pn-btn-success pn-btn-full" style={{marginBottom:10}} onClick={()=>setSubmitted(true)}>
                <i className="ti ti-circle-check"/>I Have Made This Transfer
              </button>
              <button className="pn-btn pn-btn-secondary pn-btn-full" onClick={()=>{setStep(1);setSelectedAmt(null);}}>
                <i className="ti ti-arrow-left"/>Change Amount
              </button>
            </>
          )}
          {step === 2 && submitted && (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(245,158,11,.12)',border:'2px solid var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <i className="ti ti-clock" style={{fontSize:26,color:'var(--accent)'}}/>
              </div>
              <div style={{fontSize:17,fontWeight:600,color:'var(--text-primary)',marginBottom:8}}>Payment Submitted</div>
              <div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:16}}>Your request is pending confirmation. We'll credit <strong className="pn-mono" style={{color:'var(--accent)'}}>{fmt(parseFloat(amount))}</strong> once we verify the transfer.</div>
              <div className="pn-mono" style={{display:'inline-block',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',borderRadius:8,padding:'8px 14px',color:'var(--success)',marginBottom:20}}>{REF}</div>
              <br/>
              <button className="pn-btn pn-btn-secondary" onClick={()=>{setStep(1);setAmount('');setSelectedAmt(null);setSubmitted(false);}}>Make Another Deposit</button>
            </div>
          )}
        </div>
      )}
      {tab === 'paystack' && (
        <div className="pn-card">
          <div className="pn-input-wrap">
            <label className="pn-input-label">Amount (₦)</label>
            <div className="pn-input-with-icon">
              <span className="pn-input-icon pn-mono" style={{fontWeight:500}}>₦</span>
              <input className="pn-input pn-mono" style={{paddingLeft:30,fontSize:18}} type="number" placeholder="0.00" value={amount} onChange={e=>{setAmount(e.target.value);setSelectedAmt(null);}} min={100}/>
            </div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Minimum: ₦100</div>
          </div>
          <label className="pn-input-label">Quick Amounts</label>
          <div className="pn-amount-chips">
            {QUICK.map(a=>(
              <button key={a} className={`pn-achip${selectedAmt===a?' selected':''}`} onClick={()=>selectAmt(a)}>₦{a.toLocaleString()}</button>
            ))}
          </div>
          <button className="pn-btn pn-btn-primary pn-btn-full" disabled={!amount||parseFloat(amount)<100} style={{opacity:(!amount||parseFloat(amount)<100)?.5:1}}>
            <i className="ti ti-credit-card"/>Pay with Paystack <i className="ti ti-arrow-right"/>
          </button>
          <div style={{textAlign:'center',marginTop:12,fontSize:12,color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <i className="ti ti-shield-check" style={{fontSize:14}}/>Secured by Paystack · Debit & credit cards accepted
          </div>
        </div>
      )}
      <div style={{marginTop:20}}>
        <span className="pn-section-label">Recent Transactions</span>
        <div className="pn-card" style={{padding:'0 20px'}}>
          {MOCK.transactions.map((t,i)=>(
            <div key={i} className="pn-tx-row">
              <div style={{minWidth:0}}>
                <div className="pn-tx-desc">{t.desc}</div>
                <div className="pn-tx-date">{t.date}</div>
              </div>
              <span className={t.amount>=0?'pn-tx-pos':'pn-tx-neg'}>{t.amount>=0?'+':''}{fmt(Math.abs(t.amount))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: PROFILE ────────────────────────────────────────────────────────────
function ProfileSettings() {
  const { theme, setTheme } = useContext(ThemeCtx);
  const [name, setName] = useState(MOCK.user.name);
  const [showPw, setShowPw] = useState({ cur:false, nw:false, cf:false });
  const [pw, setPw] = useState({ cur:'', nw:'', cf:'' });
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(()=>setSaved(false),2500); };
  return (
    <div>
      <div className="pn-page-title">Profile Settings</div>
      <div className="pn-page-sub">Manage your account and preferences.</div>
      <div className="pn-card" style={{marginBottom:16}}>
        <div className="pn-profile-head">
          <div className="pn-avatar-lg">{MOCK.user.initials}</div>
          <div className="pn-profile-name">{MOCK.user.name}</div>
          <div className="pn-profile-email">{MOCK.user.email}</div>
          <div className="pn-meta-badges">
            <span className="pn-badge-role">{MOCK.user.role}</span>
            <span className="pn-balance-badge">{fmt(MOCK.user.balance)}</span>
          </div>
        </div>
        <span className="pn-section-label">Personal Information</span>
        <div className="pn-input-wrap">
          <label className="pn-input-label">Full Name</label>
          <input className="pn-input" value={name} onChange={e=>setName(e.target.value)}/>
        </div>
        <div className="pn-input-wrap">
          <label className="pn-input-label">Email Address</label>
          <input className="pn-input" value={MOCK.user.email} disabled/>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Email cannot be changed</div>
        </div>
        {saved && <div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'var(--success)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}><i className="ti ti-circle-check"/>Changes saved successfully</div>}
        <button className="pn-btn pn-btn-primary pn-btn-full" onClick={handleSave}><i className="ti ti-device-floppy"/>Save Changes</button>
      </div>
      <div className="pn-card" style={{marginBottom:16}}>
        <span className="pn-section-label">Change Password</span>
        {(['cur','nw','cf']).map((k,i)=>(
          <div key={k} className="pn-input-wrap">
            <label className="pn-input-label">{['Current Password','New Password','Confirm New Password'][i]}</label>
            <div className="pn-input-eye-wrap">
              <input className="pn-input" type={showPw[k]?'text':'password'} placeholder={['Your current password','Min. 6 characters','Repeat new password'][i]} value={pw[k]} onChange={e=>setPw({...pw,[k]:e.target.value})}/>
              <button className="pn-input-eye" onClick={()=>setShowPw({...showPw,[k]:!showPw[k]})}><i className={`ti ${showPw[k]?'ti-eye-off':'ti-eye'}`}/></button>
            </div>
          </div>
        ))}
        <button className="pn-btn pn-btn-secondary pn-btn-full"><i className="ti ti-lock"/>Update Password</button>
      </div>
      <div className="pn-card">
        <span className="pn-section-label">Appearance</span>
        <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:16}}>Choose how PanelNG looks to you.</p>
        <div className="pn-theme-toggle">
          {[['light','ti-sun','Light'],['system','ti-device-laptop','System'],['dark','ti-moon','Dark']].map(([v,ic,l])=>(
            <button key={v} className={`pn-topt${theme===v?' active':''}`} onClick={()=>setTheme(v)}>
              <i className={`ti ${ic}`}/>{l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function App() {
  const { resolved } = useContext(ThemeCtx);
  const [page, setPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const navigate = (p) => { setPage(p); setSidebarOpen(false); };
  const PAGES = { overview: <Overview setPage={setPage}/>, neworder: <NewOrder/>, sms: <SmsVerify/>, accounts: <BuyAccounts balance={MOCK.user.balance} onNavigate={navigate}/>, orders: <OrderHistory/>, funds: <AddFunds/>, profile: <ProfileSettings/> };
  return (
    <div className="pn-root" data-theme={resolved}>
      <div className="pn-shell">
        <div className={`pn-overlay${sidebarOpen?' show':''}`} onClick={()=>setSidebarOpen(false)}/>
        <Sidebar page={page} setPage={navigate} isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} isMobile={true}/>
        <div className="pn-main">
          <Topbar onMenuClick={()=>setSidebarOpen(true)}/>
          <div className="pn-content">{PAGES[page]}</div>
        </div>
        <BottomNav page={page} setPage={navigate}/>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function PanelNG() {
  useEffect(() => {
    const links = [
      ['stylesheet','https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap'],
      ['stylesheet','https://cdn.jsdelivr.net/npm/@tabler/icons-webfont/dist/tabler-icons.min.css'],
    ].map(([rel,href]) => { const l=document.createElement('link');l.rel=rel;l.href=href;document.head.appendChild(l);return l; });
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => { links.forEach(l=>document.head.removeChild(l)); document.head.removeChild(style); };
  }, []);
  return <ThemeProvider><App/></ThemeProvider>;
}
