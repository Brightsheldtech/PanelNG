import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import BuyAccounts from './BuyAccounts';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

// ─── CONTEXTS ─────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ theme: 'system', setTheme: () => {}, resolved: 'dark' });
const UserCtx = createContext(null);

function ThemeProvider({ children }) {
  const [theme, setRaw] = useState(() => localStorage.getItem('panelng-theme') || 'light');
  const [resolved, setResolved] = useState('light');
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
  user: { name: 'Demo User', email: 'demo@panelng.com', role: 'user', balance: 499.85, totalOrders: 2, totalSpent: 0.15, initials: 'DU' },
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
    Microsoft: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#fff" stroke="#E2E0D8"/><rect x="4" y="4" width="7" height="7" fill="#F25022"/><rect x="13" y="4" width="7" height="7" fill="#7FBA00"/><rect x="4" y="13" width="7" height="7" fill="#00A4EF"/><rect x="13" y="13" width="7" height="7" fill="#FFB900"/></svg>,
    Amazon: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF9900"/><text x="12" y="15" fontSize="8" fontWeight="800" textAnchor="middle" fill="#1A1917" fontFamily="serif">amazon</text></svg>,
    VPN: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0EA5E9"/><path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm-1 13.5l-3-3 1.5-1.5 1.5 1.5 4-4 1.5 1.5L11 16.5z" fill="white"/><circle cx="12" cy="12" r="4" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1"/></svg>,
    NordVPN: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#4169E1"/><path d="M12 4L5 19h14L12 4zm0 3.5l4.5 9h-9L12 7.5z" fill="white"/></svg>,
    ExpressVPN: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#DA3940"/><path d="M12 5a7 7 0 100 14A7 7 0 0012 5zm0 2a5 5 0 110 10A5 5 0 0112 7zm0 2a3 3 0 100 6 3 3 0 000-6z" fill="white"/></svg>,
    Proxy: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#6366F1"/><path d="M4 8h7v2H4zm9 0h7v2h-7zM8 12h8v2H8zm-4 4h7v2H4zm9 0h7v2h-7z" fill="white" opacity=".8"/><path d="M11 7l2 2-2 2M13 15l-2 2 2 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>,
    Other: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#6B6860"/><circle cx="8" cy="12" r="1.5" fill="white"/><circle cx="12" cy="12" r="1.5" fill="white"/><circle cx="16" cy="12" r="1.5" fill="white"/></svg>,
  };
  return icons[name] || icons['Other'];
}

function svcToIconName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('whatsapp')) return 'WhatsApp';
  if (n.includes('telegram')) return 'Telegram';
  if (n.includes('instagram')) return 'Instagram';
  if (n.includes('tiktok') || n.includes('tik tok') || n.includes('douyin')) return 'TikTok';
  if (n.includes('facebook')) return 'Facebook';
  if (n.includes('twitter') || n === 'x') return 'Twitter';
  if (n.includes('youtube')) return 'YouTube';
  if (n.includes('snapchat')) return 'Snapchat';
  if (n.includes('viber')) return 'Viber';
  if (n.includes('tinder')) return 'Tinder';
  if (n.includes('netflix')) return 'Netflix';
  if (n.includes('uber eats')) return 'Uber';
  if (n.includes('uber')) return 'Uber';
  if (n.includes('airbnb')) return 'Airbnb';
  if (n.includes('paypal')) return 'PayPal';
  if (n.includes('binance')) return 'Binance';
  if (n.includes('discord')) return 'Discord';
  if (n.includes('spotify')) return 'Spotify';
  if (n.includes('threads')) return 'Threads';
  if (n.includes('linkedin')) return 'LinkedIn';
  if (n.includes('nordvpn')) return 'NordVPN';
  if (n.includes('expressvpn')) return 'ExpressVPN';
  if (n.includes('vpn')) return 'VPN';
  if (n.includes('microsoft')) return 'Microsoft';
  if (n.includes('amazon')) return 'Amazon';
  if (n.includes('gmail') || n.includes('google')) return 'Gmail';
  if (n.includes('proxy')) return 'Proxy';
  return 'Other';
}

function ServiceIcon({ name, size = 36 }) {
  const iconName = svcToIconName(name);
  if (iconName !== 'Other') return <PlatformIcon name={iconName} size={size}/>;
  const COLORS = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#14B8A6','#F97316','#84CC16'];
  const color = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  const r = Math.max(6, size * 0.22);
  return (
    <div style={{width:size,height:size,borderRadius:r,background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.round(size*0.44),fontWeight:700,color:'#fff',flexShrink:0,fontFamily:'Plus Jakarta Sans,system-ui,sans-serif'}}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
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
html,body{overflow-x:hidden;max-width:100vw}
.pn-root*,.pn-root *::before,.pn-root *::after{box-sizing:border-box;margin:0;padding:0}
.pn-root{font-family:'Plus Jakarta Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:-0.01em;background:var(--bg-base);color:var(--text-primary);min-height:100vh;font-size:15px;line-height:1.5;overflow-x:hidden;width:100%;max-width:100vw}
.pn-root[data-theme="light"]{--bg-base:#F6F5F2;--bg-surface:#FFFFFF;--bg-raised:#F0EEE9;--bg-input:#FAFAF8;--border:#E2E0D8;--border-strong:#C8C5BC;--text-primary:#1A1917;--text-secondary:#6B6860;--text-muted:#9E9B94;--accent:#D97706;--accent-hover:#B45309;--accent-text:#FFFFFF;--success:#16A34A;--danger:#DC2626;--info:#2563EB;--tag-bg:#EDE9DC;--tag-text:#78716C;--chip-active-bg:#1A1917;--chip-active-text:#FFFFFF;--shadow-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);--shadow-md:0 4px 16px rgba(0,0,0,.08)}
.pn-root[data-theme="dark"]{--bg-base:#0F0F0D;--bg-surface:#1A1917;--bg-raised:#242320;--bg-input:#18181B;--border:#2C2B27;--border-strong:#3D3C37;--text-primary:#F0EEE9;--text-secondary:#A8A49C;--text-muted:#6B6860;--accent:#F59E0B;--accent-hover:#FBBF24;--accent-text:#1A1917;--success:#22C55E;--danger:#F87171;--info:#60A5FA;--tag-bg:#2C2B27;--tag-text:#A8A49C;--chip-active-bg:#F0EEE9;--chip-active-text:#1A1917;--shadow-sm:0 1px 3px rgba(0,0,0,.25);--shadow-md:0 4px 16px rgba(0,0,0,.4)}

/* Layout */
.pn-shell{display:flex;min-height:100vh;overflow-x:hidden;width:100%}
.pn-sidebar{width:240px;flex-shrink:0;background:var(--bg-surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:200;overflow-y:auto}
.pn-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-width:0;overflow-x:hidden}
.pn-content{flex:1;overflow-y:auto;overflow-x:hidden;padding:24px 24px 100px;scrollbar-width:none}
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
.pn-balance-chip-label{font-family:'Plus Jakarta Sans',sans-serif;font-size:8px;text-transform:uppercase;letter-spacing:1.2px;color:var(--accent);font-weight:600;opacity:.8}
.pn-balance-chip-amount{font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;color:var(--accent);white-space:nowrap;font-variant-numeric:tabular-nums;letter-spacing:-0.02em}
.pn-theme-icon-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--text-muted);border-radius:8px;transition:all 150ms ease;font-size:18px;position:relative}
.pn-theme-icon-btn:hover{background:var(--bg-raised);color:var(--text-primary)}
.pn-tooltip{position:absolute;top:calc(100% + 6px);right:0;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:11px;color:var(--text-secondary);white-space:nowrap;box-shadow:var(--shadow-sm);pointer-events:none;z-index:100}
/* Notification panel */
.pn-notif-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;background:#FF3B30;border-radius:9px;border:2px solid var(--bg-surface);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;line-height:1;padding:0 4px;pointer-events:none}
.pn-notif-panel{position:absolute;top:calc(100% + 8px);right:0;width:340px;max-height:480px;background:var(--bg-surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.18);z-index:200;display:flex;flex-direction:column;overflow:hidden}
@media(max-width:400px){.pn-notif-panel{width:calc(100vw - 24px);right:-4px}}
.pn-notif-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid var(--border);flex-shrink:0}
.pn-notif-title{font-size:14px;font-weight:600;color:var(--text-primary)}
.pn-notif-clear{font-size:11px;color:var(--accent);background:none;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;padding:0}
.pn-notif-list{overflow-y:auto;flex:1;scrollbar-width:none}
.pn-notif-list::-webkit-scrollbar{display:none}
.pn-notif-item{display:flex;align-items:flex-start;gap:12px;padding:13px 16px;border-bottom:0.5px solid var(--border);transition:background 120ms ease;cursor:default}
.pn-notif-item:last-child{border-bottom:none}
.pn-notif-item.unread{background:rgba(245,158,11,.04)}
.pn-notif-item:hover{background:var(--bg-raised)}
.pn-notif-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;margin-top:1px}
.pn-notif-body{flex:1;min-width:0}
.pn-notif-ntitle{font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:3px;line-height:1.3}
.pn-notif-msg{font-size:12px;color:var(--text-secondary);line-height:1.45;margin-bottom:4px}
.pn-notif-time{font-size:10px;color:var(--text-muted)}
.pn-notif-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:6px}
.pn-notif-empty{padding:40px 20px;text-align:center;color:var(--text-muted)}
.pn-notif-empty i{font-size:32px;display:block;margin-bottom:10px;opacity:.4}
.pn-notif-empty p{font-size:13px}

/* Sidebar */
.pn-sidebar-brand{display:flex;align-items:center;gap:10px;padding:20px 16px 16px;border-bottom:1px solid var(--border)}
.pn-close-btn{margin-left:auto;width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--text-muted);border-radius:6px;font-size:16px;transition:all 150ms ease}
.pn-close-btn:hover{background:var(--bg-raised);color:var(--text-primary)}
.pn-sidebar-wallet{margin:12px;padding:14px 16px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:12px}
.pn-root[data-theme="light"] .pn-sidebar-wallet{background:rgba(217,119,6,.06);border-color:rgba(217,119,6,.15)}
.pn-wallet-label{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px}
.pn-wallet-amount{font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums;letter-spacing:-0.03em}
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
.pn-stat-value{font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums;letter-spacing:-0.02em}
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
.pn-balance-badge{background:rgba(34,197,94,.1);color:var(--success);border:1px solid rgba(34,197,94,.2);font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:600;padding:2px 10px;border-radius:100px;font-variant-numeric:tabular-nums}

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

/* SMS service list */
.pn-svc-search-wrap{position:relative;margin-bottom:12px}
.pn-svc-search{width:100%;height:44px;background:var(--bg-input);border:1px solid var(--border);border-radius:22px;padding:0 16px 0 42px;font-size:14px;color:var(--text-primary);font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border-color 150ms ease,box-shadow 150ms ease}
.pn-svc-search:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(245,158,11,.12)}
.pn-root[data-theme="light"] .pn-svc-search:focus{box-shadow:0 0 0 2px rgba(217,119,6,.1)}
.pn-svc-search::placeholder{color:var(--text-muted)}
.pn-svc-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--text-muted);pointer-events:none}
.pn-svc-list{background:var(--bg-surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;max-height:54vh;overflow-y:auto;scrollbar-width:none;margin-bottom:16px}
.pn-svc-list::-webkit-scrollbar{display:none}
.pn-svc-row{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:0.5px solid var(--border);cursor:pointer;transition:background 120ms ease}
.pn-svc-row:last-child{border-bottom:none}
.pn-svc-row:hover{background:var(--bg-raised)}
.pn-svc-row.active{background:rgba(245,158,11,.06)}
.pn-root[data-theme="light"] .pn-svc-row.active{background:rgba(217,119,6,.05)}
.pn-svc-info{flex:1;min-width:0}
.pn-svc-name{font-size:14px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pn-svc-row.active .pn-svc-name{color:var(--accent);font-weight:600}
.pn-svc-meta{font-size:11px;color:var(--text-muted);margin-top:2px}
.pn-svc-chevron{color:var(--border-strong);font-size:14px;flex-shrink:0}
.pn-svc-row.active .pn-svc-chevron{color:var(--accent)}

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
/* Transaction detail sheet */
.pn-tx-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:300;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:600px){.pn-tx-backdrop{align-items:center}}
.pn-tx-sheet{background:var(--bg-surface);width:100%;max-width:480px;border-radius:22px 22px 0 0;padding:0 0 32px;box-shadow:0 -8px 40px rgba(0,0,0,.25);animation:pn-sheet-up 220ms cubic-bezier(0.34,1.26,0.64,1)}
@media(min-width:600px){.pn-tx-sheet{border-radius:20px;margin:16px}}
@keyframes pn-sheet-up{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
.pn-tx-sheet-drag{width:36px;height:4px;border-radius:2px;background:var(--border);margin:12px auto 0}
.pn-tx-sheet-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px}
.pn-tx-sheet-close{width:28px;height:28px;border-radius:50%;background:var(--bg-raised);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-muted);font-size:14px}
.pn-tx-sheet-body{padding:0 20px}
.pn-tx-amount-hero{text-align:center;padding:20px 0 24px}
.pn-tx-amount-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:24px}
.pn-tx-amount-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:34px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-0.04em;margin-bottom:6px}
.pn-tx-amount-label{font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:500}
.pn-tx-details{background:var(--bg-raised);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.pn-tx-row-d{display:flex;align-items:flex-start;justify-content:space-between;padding:13px 16px;border-bottom:0.5px solid var(--border);gap:16px}
.pn-tx-row-d:last-child{border-bottom:none}
.pn-tx-row-label{font-size:12px;color:var(--text-muted);font-weight:500;flex-shrink:0}
.pn-tx-row-val{font-size:12px;color:var(--text-primary);font-weight:600;text-align:right;word-break:break-all}
.pn-tx-status-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
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
.pn-balance-hero-amount{font-family:'Plus Jakarta Sans',sans-serif;font-size:34px;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums;letter-spacing:-0.04em}

/* Referral page */
.pn-ref-code-row{display:flex;align-items:center;gap:8px;background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-top:10px}
.pn-ref-code-val{font-family:'Geist Mono','Courier New',monospace;font-size:15px;font-weight:600;color:var(--accent);flex:1;letter-spacing:0.05em;word-break:break-all}
.pn-copy-btn{height:30px;padding:0 12px;border-radius:8px;background:var(--accent);color:var(--accent-text);border:none;cursor:pointer;font-size:12px;font-weight:600;transition:background 150ms ease;white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0}
.pn-copy-btn:hover{background:var(--accent-hover)}
.pn-ref-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.pn-ref-stat{background:var(--bg-surface);border:1px solid var(--border);border-radius:14px;padding:16px}
.pn-ref-stat-label{font-size:11px;font-weight:500;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.8px}
.pn-ref-stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums;letter-spacing:-0.02em}
.pn-ref-stat-val.success{color:var(--success)}
.pn-ref-list{background:var(--bg-surface);border:1px solid var(--border);border-radius:16px;overflow:hidden}
.pn-ref-list-item{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:0.5px solid var(--border)}
.pn-ref-list-item:last-child{border-bottom:none}

/* Responsive */
@media (max-width:768px){
  .pn-sidebar{display:none}
  .pn-sidebar.show,.pn-sidebar.drawer{display:flex}
  .pn-main{margin-left:0;overflow-x:hidden;width:100%}
  .pn-bottom-nav{display:block}
  .pn-content{padding:16px 12px 90px;overflow-x:hidden;width:100%;max-width:100%}
  .pn-topbar{padding:0 12px;gap:8px;overflow:visible}
  .pn-notif-panel{position:fixed;top:60px;right:8px;left:8px;width:auto;max-width:none}
  .pn-topbar-brand{min-width:0;flex:1}
  .pn-brand-name{font-size:14px}
  .pn-balance-chip{padding:4px 8px}
  .pn-balance-chip-amount{font-size:12px}
  .pn-balance-chip-label{font-size:8px}
  .pn-hamburger{display:flex!important}
  .pn-greeting-title{font-size:20px}
  .pn-stat-grid{grid-template-columns:1fr 1fr;gap:10px}
  .pn-stat-value{font-size:18px}
  .pn-stat-card{padding:14px}
  .pn-order-header,.pn-order-row{grid-template-columns:68px 48px 1fr 56px;gap:6px;padding:10px 12px;font-size:11px}
  .pn-actions{gap:6px;flex-wrap:wrap}
  .pn-action-pill{height:32px;padding:0 12px;font-size:12px}
  .pn-chips-scroll{margin-bottom:14px}
  .pn-page-title{font-size:18px}
  .pn-balance-hero-amount{font-size:26px}
  .pn-dd-panel{max-height:240px}
  .pn-card{padding:16px}
}
@media (max-width:480px){
  .pn-order-header,.pn-order-row{grid-template-columns:58px 40px 1fr 52px;gap:4px;padding:9px 10px}
  .pn-stat-value{font-size:16px}
  .pn-balance-hero-amount{font-size:22px}
  .pn-content{padding:12px 10px 90px}
  .pn-ref-stat-val{font-size:18px}
}
@media (min-width:769px){
  .pn-hamburger{display:none!important}
}
`;

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const NOTIF_ICONS = {
  wallet_credit:      { icon:'ti-wallet',          bg:'rgba(34,197,94,.12)',  color:'var(--success)' },
  payment_confirmed:  { icon:'ti-circle-check',    bg:'rgba(34,197,94,.12)',  color:'var(--success)' },
  payment_rejected:   { icon:'ti-alert-circle',    bg:'rgba(220,38,38,.12)',  color:'var(--danger)'  },
  order_placed:       { icon:'ti-shopping-cart',   bg:'rgba(99,102,241,.12)', color:'#818cf8'        },
  order_update:       { icon:'ti-refresh',         bg:'rgba(99,102,241,.12)', color:'#818cf8'        },
  welcome_bonus:      { icon:'ti-gift',            bg:'rgba(245,158,11,.12)', color:'var(--accent)'  },
  referral_reward:    { icon:'ti-users',           bg:'rgba(245,158,11,.12)', color:'var(--accent)'  },
  info:               { icon:'ti-info-circle',     bg:'rgba(107,114,128,.12)',color:'var(--text-muted)'},
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function Topbar({ onMenuClick, onLogoClick }) {
  const { theme, setTheme } = useContext(ThemeCtx);
  const user = useContext(UserCtx) || MOCK.user;
  const [showTip, setShowTip] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const panelRef = useRef(null);

  const unread = notifs.filter(n => !n.is_read).length;

  const fetchNotifs = async () => {
    if (!localStorage.getItem('panelng_token')) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!showNotif) return;
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotif]);

  const openPanel = async () => {
    setShowNotif(v => !v);
    if (!showNotif && unread > 0) {
      // Mark all read optimistically
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      try { await api.post('/notifications/read-all'); } catch (_) {}
    }
  };

  const cycle = () => { const m = ['light','dark','system']; setTheme(m[(m.indexOf(theme)+1)%3]); };
  const icons = { light: 'ti-sun', dark: 'ti-moon', system: 'ti-device-laptop' };
  const labels = { light: 'Light mode', dark: 'Dark mode', system: 'System mode' };

  return (
    <header className="pn-topbar" style={{justifyContent:'space-between'}}>
      {/* Left: hamburger (mobile) + logo */}
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <button className="pn-hamburger" onClick={onMenuClick} aria-label="Open menu">
          <i className="ti ti-menu-2" style={{fontSize:18}}/>
        </button>
        <button
          onClick={onLogoClick}
          style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',padding:0,textDecoration:'none'}}
          aria-label="Go to Overview"
        >
          <div className="pn-brand-mark" style={{width:30,height:30,borderRadius:9,fontSize:15}}>P</div>
          <span className="pn-brand-name" style={{fontWeight:700,fontSize:16,letterSpacing:'-0.3px'}}>PanelNG</span>
        </button>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
        <div style={{position:'relative'}} onMouseEnter={()=>setShowTip(true)} onMouseLeave={()=>setShowTip(false)}>
          <button className="pn-theme-icon-btn" onClick={cycle}><i className={`ti ${icons[theme]}`}/></button>
          {showTip && <div className="pn-tooltip">{labels[theme]}</div>}
        </div>
        <div style={{position:'relative'}} ref={panelRef}>
          <button className="pn-theme-icon-btn" aria-label="Notifications" onClick={openPanel}>
            <i className="ti ti-bell"/>
            {unread > 0 && <span className="pn-notif-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {showNotif && (
            <div className="pn-notif-panel">
              <div className="pn-notif-head">
                <span className="pn-notif-title">Notifications {unread > 0 && <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:12}}>({unread} new)</span>}</span>
                {notifs.length > 0 && (
                  <button className="pn-notif-clear" onClick={async () => {
                    setNotifs([]);
                    try { await api.post('/notifications/read-all'); } catch (_) {}
                  }}>Clear all</button>
                )}
              </div>
              <div className="pn-notif-list">
                {notifs.length === 0 ? (
                  <div className="pn-notif-empty">
                    <i className="ti ti-bell-off"/>
                    <p>No notifications yet</p>
                  </div>
                ) : notifs.map(n => {
                  const style = NOTIF_ICONS[n.type] || NOTIF_ICONS.info;
                  return (
                    <div key={n.id} className={`pn-notif-item${n.is_read ? '' : ' unread'}`}>
                      <div className="pn-notif-icon" style={{background:style.bg,color:style.color}}>
                        <i className={`ti ${style.icon}`}/>
                      </div>
                      <div className="pn-notif-body">
                        <div className="pn-notif-ntitle">{n.title}</div>
                        <div className="pn-notif-msg">{n.message}</div>
                        <div className="pn-notif-time">{timeAgo(n.created_at)}</div>
                      </div>
                      {!n.is_read && <div className="pn-notif-dot"/>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, isOpen, onClose, isMobile }) {
  const user = useContext(UserCtx) || MOCK.user;
  const NAV = [
    { id:'overview', icon:'ti-home', label:'Overview' },
    { id:'neworder', icon:'ti-circle-plus', label:'New Order' },
    { id:'orders', icon:'ti-receipt', label:'Order History' },
    { id:'transactions', icon:'ti-clock-dollar', label:'Transactions' },
    { id:'funds', icon:'ti-wallet', label:'Add Funds' },
    { id:'referral', icon:'ti-users', label:'Referral' },
    { id:'profile', icon:'ti-user-circle', label:'Profile' },
  ];
  return (
    <aside className={`pn-sidebar${isMobile ? ' drawer' + (isOpen ? ' open' : '') : ''}`}>
      <div className="pn-sidebar-brand">
        <div className="pn-brand-mark">P</div>
        <span className="pn-brand-name">PanelNG</span>
        {isMobile && <button className="pn-close-btn" onClick={onClose}><i className="ti ti-x"/></button>}
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
          <div className="pn-avatar">{user.initials}</div>
          <div>
            <div className="pn-user-name">{user.name}</div>
            <div className="pn-user-role">{user.role}</div>
          </div>
        </div>
        <button className="pn-btn-signout" onClick={user.logout}><i className="ti ti-logout"/>Sign Out</button>
      </div>
    </aside>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ page, setPage }) {
  const items = [
    { id:'overview', icon:'ti-layout-dashboard', label:'Dashboard' },
    { id:'neworder', icon:'ti-circle-plus', label:'New Order' },
    { id:'orders', icon:'ti-receipt', label:'Orders' },
    { id:'referral', icon:'ti-users', label:'Referral' },
    { id:'profile', icon:'ti-user-circle', label:'Profile' },
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

// ─── TRANSACTION DETAIL MODAL ─────────────────────────────────────────────────
function TxDetailSheet({ tx, onClose }) {
  const isCredit = tx.type === 'credit';
  const isPending = tx.status === 'pending';
  const isRejected = tx.status === 'rejected';
  const iconBg  = isPending ? 'rgba(245,158,11,.15)' : isRejected ? 'rgba(220,38,38,.15)' : isCredit ? 'rgba(34,197,94,.15)' : 'rgba(220,38,38,.15)';
  const iconColor = isPending ? 'var(--accent)' : isRejected ? 'var(--danger)' : isCredit ? 'var(--success)' : 'var(--danger)';
  const icon = isPending ? 'ti-clock' : isRejected ? 'ti-x' : isCredit ? 'ti-arrow-down-left' : 'ti-arrow-up-right';
  const amtColor = isPending ? 'var(--accent)' : (isCredit && !isRejected ? 'var(--success)' : 'var(--danger)');
  const statusColors = { success:['rgba(34,197,94,.12)','var(--success)'], completed:['rgba(34,197,94,.12)','var(--success)'], pending:['rgba(245,158,11,.12)','var(--accent)'], rejected:['rgba(220,38,38,.12)','var(--danger)'], processing:['rgba(96,165,250,.12)','var(--info)'], cancelled:['rgba(220,38,38,.12)','var(--danger)'] };
  const [sBg, sFg] = statusColors[tx.status] || statusColors.success;
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-NG',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

  return (
    <div className="pn-tx-backdrop" onClick={onClose}>
      <div className="pn-tx-sheet" onClick={e=>e.stopPropagation()}>
        <div className="pn-tx-sheet-drag"/>
        <div className="pn-tx-sheet-head">
          <span style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>Transaction Details</span>
          <button className="pn-tx-sheet-close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div className="pn-tx-sheet-body">
          {/* Amount hero */}
          <div className="pn-tx-amount-hero">
            <div className="pn-tx-amount-icon" style={{background:iconBg,color:iconColor}}>
              <i className={`ti ${icon}`}/>
            </div>
            <div className="pn-tx-amount-val" style={{color:amtColor}}>
              {isCredit && !isRejected ? '+' : '-'}₦{Number(tx.amount).toLocaleString('en-NG',{minimumFractionDigits:2})}
            </div>
            <div className="pn-tx-amount-label">{isPending ? 'Pending' : isCredit ? 'Money received' : 'Money sent'}</div>
          </div>
          {/* Detail rows */}
          <div className="pn-tx-details">
            <div className="pn-tx-row-d">
              <span className="pn-tx-row-label">Description</span>
              <span className="pn-tx-row-val">{tx.description || '—'}</span>
            </div>
            <div className="pn-tx-row-d">
              <span className="pn-tx-row-label">Reference</span>
              <span className="pn-tx-row-val" style={{fontFamily:'monospace',fontSize:11}}>{tx.reference || '—'}</span>
            </div>
            <div className="pn-tx-row-d">
              <span className="pn-tx-row-label">Date</span>
              <span className="pn-tx-row-val">{fmtDate(tx.created_at)}</span>
            </div>
            <div className="pn-tx-row-d">
              <span className="pn-tx-row-label">Type</span>
              <span className="pn-tx-row-val" style={{textTransform:'capitalize'}}>{tx.type}</span>
            </div>
            <div className="pn-tx-row-d">
              <span className="pn-tx-row-label">Status</span>
              <span className="pn-tx-status-pill" style={{background:sBg,color:sFg}}>
                <i className={`ti ${isPending?'ti-clock':isRejected?'ti-x':'ti-circle-check'}`} style={{fontSize:11}}/>
                {({'success':'Successful','completed':'Successful','pending':'Pending','rejected':'Rejected','processing':'Processing','cancelled':'Cancelled'}[tx.status] || 'Successful')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: OVERVIEW ───────────────────────────────────────────────────────────
function Overview({ setPage }) {
  const user = useContext(UserCtx) || MOCK.user;
  const [recentTx, setRecentTx] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState(false);
  const [refBalance, setRefBalance] = useState(0);
  const [refCount, setRefCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedTx, setSelectedTx] = useState(null);

  const loadOverview = () => {
    setTxLoading(true);
    setTxError(false);
    Promise.all([
      api.get('/wallet/transactions', { params: { limit: 5 } }),
      api.get('/referral/stats').catch(() => ({ data: {} })),
    ]).then(([txRes, refRes]) => {
      const txs = txRes.data?.transactions || [];
      setRecentTx(txs);
      setPendingCount(txs.filter(t => t.status === 'pending').length);
      setRefBalance(Number(refRes.data?.referral_balance || 0));
      setRefCount(Number(refRes.data?.referral_count || 0));
    }).catch(() => {
      setTxError(true);
    }).finally(() => setTxLoading(false));
  };

  useEffect(() => { loadOverview(); }, []);

  const S = { card: {background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:16} };

  return (
    <div style={{paddingBottom:8}}>

      {/* Greeting */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:700,color:'var(--text-primary)',marginBottom:3,letterSpacing:'-0.3px'}}>
          {greet()}, {user.name.split(' ')[0]}! 👋
        </div>
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>Here's what's happening with your account today.</div>
      </div>

      {/* Wallet + Referral balance row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        <div style={{...S.card,padding:'14px 16px'}}>
          <div style={{fontSize:9,fontWeight:600,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:6}}>WALLET BALANCE</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:'var(--text-primary)',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.03em'}}>{fmt(user.balance)}</div>
        </div>
        <div style={{...S.card,padding:'14px 16px',position:'relative'}}>
          <div style={{fontSize:9,fontWeight:600,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:6}}>REFERRAL BALANCE</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:'var(--success)',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.03em'}}>{fmt(refBalance)}</div>
          <div style={{position:'absolute',top:12,right:12,width:28,height:28,borderRadius:8,background:'rgba(34,197,94,.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-wallet" style={{fontSize:14,color:'var(--success)'}}/>
          </div>
        </div>
      </div>

      {/* 4-column stat grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
        {[
          { label:'Total Orders',   value: user.totalOrders,      icon:'ti-shopping-cart', bg:'rgba(34,197,94,.1)',   color:'var(--success)', mono:false },
          { label:'Total Spent',    value: fmt(user.totalSpent),  icon:'ti-chart-bar',     bg:'rgba(245,158,11,.1)', color:'var(--accent)',   mono:true  },
          { label:'Pending Orders', value: pendingCount,          icon:'ti-clock',         bg:'rgba(248,113,113,.1)',color:'var(--danger)',   mono:false },
          { label:'Wallet Balance', value: fmt(user.balance),     icon:'ti-credit-card',   bg:'rgba(96,165,250,.1)', color:'var(--info)',     mono:true  },
        ].map(s => (
          <div key={s.label} style={{...S.card,padding:'10px 8px',textAlign:'center'}}>
            <div style={{width:28,height:28,borderRadius:7,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 6px'}}>
              <i className={`ti ${s.icon}`} style={{fontSize:13,color:s.color}}/>
            </div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:s.mono?10:14,fontWeight:700,color:'var(--text-primary)',fontVariantNumeric:'tabular-nums',letterSpacing:s.mono?'-0.02em':0,lineHeight:1.2}}>{s.value}</div>
            <div style={{fontSize:9,color:'var(--text-muted)',marginTop:3,lineHeight:1.3}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Funds + View Wallet buttons */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        <button className="pn-btn pn-btn-primary pn-btn-full" style={{height:44,borderRadius:12,fontWeight:600}} onClick={()=>setPage('funds')}>
          <i className="ti ti-plus" style={{fontSize:15}}/>Add Funds
        </button>
        <button className="pn-btn pn-btn-secondary pn-btn-full" style={{height:44,borderRadius:12,fontWeight:600}} onClick={()=>setPage('neworder')}>
          New Order <i className="ti ti-arrow-right" style={{fontSize:15}}/>
        </button>
      </div>

      {/* Refer & Earn card */}
      <div style={{...S.card,padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
        <div style={{flexShrink:0,width:48,height:48}}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="13" fill="#ECFDF5"/>
            <rect x="9" y="24" width="30" height="16" rx="2" fill="#10B981"/>
            <rect x="8" y="18" width="32" height="7" rx="2" fill="#059669"/>
            <rect x="21" y="18" width="6" height="22" fill="#F59E0B"/>
            <rect x="8" y="20" width="32" height="3" fill="#F59E0B"/>
            <path d="M21 18 C19 12 10 11 10 16 C10 20 17 20 21 18Z" fill="#FCD34D"/>
            <path d="M27 18 C29 12 38 11 38 16 C38 20 31 20 27 18Z" fill="#FCD34D"/>
            <circle cx="24" cy="18" r="3" fill="#F59E0B"/>
          </svg>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',marginBottom:2}}>Refer &amp; Earn</div>
          <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:6}}>Invite friends and earn commissions on their orders.</div>
          <div style={{display:'flex',gap:16}}>
            <div>
              <div style={{fontSize:9,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px'}}>Referrals</div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>{refCount}</div>
            </div>
            <div>
              <div style={{fontSize:9,fontWeight:500,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.8px'}}>Earned</div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>{fmt(refBalance)}</div>
            </div>
          </div>
        </div>
        <button
          onClick={()=>setPage('referral')}
          style={{flexShrink:0,height:32,padding:'0 12px',borderRadius:8,background:'rgba(34,197,94,.12)',color:'var(--success)',border:'1px solid rgba(34,197,94,.25)',fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5,fontFamily:"'Plus Jakarta Sans',sans-serif"}}
        >
          <i className="ti ti-share" style={{fontSize:12}}/>Share Link
        </button>
      </div>

      {/* Recent Transactions */}
      <div style={{marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <span style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>Recent Transactions</span>
          <button className="pn-btn pn-btn-ghost pn-btn-sm" onClick={()=>setPage('transactions')}>View all <i className="ti ti-arrow-right"/></button>
        </div>
        <div style={{...S.card,overflow:'hidden'}}>
          {txLoading ? (
            <div style={{padding:'24px 0',textAlign:'center'}}><i className="ti ti-loader-2" style={{fontSize:20,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/></div>
          ) : txError ? (
            <div className="pn-empty">
              <i className="ti ti-wifi-off pn-empty-icon"/>
              <div className="pn-empty-title">Could not load transactions</div>
              <div className="pn-empty-sub">Check your connection</div>
              <button className="pn-btn pn-btn-ghost pn-btn-sm" style={{marginTop:8}} onClick={loadOverview}><i className="ti ti-refresh"/>Retry</button>
            </div>
          ) : recentTx.length === 0 ? (
            <div className="pn-empty"><i className="ti ti-receipt pn-empty-icon"/><div className="pn-empty-title">No transactions yet</div><div className="pn-empty-sub">Your activity will appear here</div></div>
          ) : recentTx.map((t, i) => {
            const isCredit = t.type === 'credit';
            const isPending = t.status === 'pending';
            const isRejected = t.status === 'rejected';
            const iconBg = isPending ? 'rgba(245,158,11,.1)' : isRejected ? 'rgba(248,113,113,.1)' : isCredit ? 'rgba(34,197,94,.1)' : 'rgba(248,113,113,.1)';
            const iconColor = isPending ? 'var(--accent)' : isRejected ? 'var(--danger)' : isCredit ? 'var(--success)' : 'var(--danger)';
            const icon = isPending ? 'ti-clock' : isRejected ? 'ti-x' : isCredit ? 'ti-arrow-down-left' : 'ti-arrow-up-right';
            const amtColor = isPending ? 'var(--accent)' : (isCredit && !isRejected ? 'var(--success)' : 'var(--danger)');
            const amtPrefix = isCredit && !isRejected ? '+' : '-';
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={()=>setSelectedTx(t)}
                onKeyDown={e=>e.key==='Enter'&&setSelectedTx(t)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderBottom:i<recentTx.length-1?'0.5px solid var(--border)':'none',transition:'background 150ms ease',cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-raised)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}
              >
                <div style={{width:34,height:34,borderRadius:9,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <i className={`ti ${icon}`} style={{fontSize:15,color:iconColor}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.description}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-NG',{month:'short',day:'numeric',year:'numeric'}) : ''}</div>
                </div>
                <div style={{flexShrink:0,textAlign:'right',display:'flex',alignItems:'center',gap:6}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
                    <div style={{fontSize:12,fontWeight:700,color:amtColor,fontVariantNumeric:'tabular-nums'}}>{amtPrefix}₦{Number(t.amount).toLocaleString('en-NG',{minimumFractionDigits:2})}</div>
                    {(() => {
                      const st = t.status || 'success';
                      const statusPill = { success:['rgba(34,197,94,.12)','var(--success)','Successful'], completed:['rgba(34,197,94,.12)','var(--success)','Successful'], pending:['rgba(245,158,11,.12)','var(--accent)','Pending'], rejected:['rgba(220,38,38,.12)','var(--danger)','Rejected'], processing:['rgba(96,165,250,.12)','var(--info)','Processing'], cancelled:['rgba(220,38,38,.12)','var(--danger)','Cancelled'] };
                      const [bg,fg,label] = statusPill[st] || statusPill.success;
                      return <span style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:10,background:bg,color:fg,letterSpacing:'0.02em'}}>{label}</span>;
                    })()}
                  </div>
                  <i className="ti ti-chevron-right" style={{fontSize:14,color:'var(--text-muted)',opacity:.5}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',marginBottom:10}}>Quick Actions</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button
            onClick={()=>setPage('neworder')}
            style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'#1A1917',border:'none',borderRadius:14,cursor:'pointer',transition:'opacity 150ms ease',textAlign:'left',width:'100%'}}
            onMouseEnter={e=>e.currentTarget.style.opacity='0.9'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          >
            <div style={{width:38,height:38,borderRadius:10,background:'rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className="ti ti-shopping-cart" style={{fontSize:18,color:'#fff'}}/>
            </div>
            <div style={{flex:1,textAlign:'left'}}>
              <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:2}}>Place New Order</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.6)'}}>Start a new order</div>
            </div>
            <i className="ti ti-chevron-right" style={{fontSize:16,color:'rgba(255,255,255,.5)',flexShrink:0}}/>
          </button>
          <button
            onClick={()=>setPage('funds')}
            style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',...S.card,cursor:'pointer',transition:'background 150ms ease',textAlign:'left',width:'100%'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-raised)'}
            onMouseLeave={e=>e.currentTarget.style.background='var(--bg-surface)'}
          >
            <div style={{width:38,height:38,borderRadius:10,background:'rgba(245,158,11,.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className="ti ti-wallet" style={{fontSize:18,color:'var(--accent)'}}/>
            </div>
            <div style={{flex:1,textAlign:'left'}}>
              <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>Add Funds</div>
              <div style={{fontSize:12,color:'var(--text-muted)'}}>Top up your wallet</div>
            </div>
            <i className="ti ti-chevron-right" style={{fontSize:16,color:'var(--text-muted)',flexShrink:0}}/>
          </button>
        </div>
      </div>

      {/* Transaction detail sheet */}
      {selectedTx && <TxDetailSheet tx={selectedTx} onClose={()=>setSelectedTx(null)}/>}

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
  return (
    <div className="pn-dd-wrap" ref={ref}>
      <div className={`pn-dd-trigger${open?' open':''}`} onClick={()=>setOpen(!open)}>
        {selected ? (
          <>
            <PlatformIcon name={selected.platform || 'Other'} size={18}/>
            <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected.name}</span>
            <span className="pn-mono" style={{fontSize:12,color:'var(--accent)',flexShrink:0}}>₦{selected.sell_price}/1k</span>
          </>
        ) : (
          <span style={{color:'var(--text-muted)',flex:1}}>— Choose a service —</span>
        )}
        <i className="ti ti-chevron-down pn-dd-arrow"/>
      </div>
      {open && (
        <div className="pn-dd-panel">
          {services.map(s => (
            <div key={s.id} className={`pn-dd-item${value===s.id?' selected':''}`} onClick={()=>{onChange(s.id);setOpen(false);}}>
              <PlatformIcon name={s.platform || 'Other'} size={20}/>
              <div className="pn-dd-item-center">
                <div className="pn-dd-item-name">{s.name}</div>
                <div className="pn-dd-tags"><span className="pn-tag">{s.min_quantity?.toLocaleString()} – {s.max_quantity?.toLocaleString()}</span></div>
              </div>
              <div className="pn-dd-price">₦{s.sell_price}/1k</div>
              {value===s.id && <i className="ti ti-check" style={{color:'var(--accent)',fontSize:14}}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PAGE: NEW ORDER ──────────────────────────────────────────────────────────
function NewOrder() {
  const user = useContext(UserCtx);
  const [allServices, setAllServices] = useState([]);
  const [loadingSvc, setLoadingSvc] = useState(true);
  const [platform, setPlatform] = useState('All');
  const [serviceId, setServiceId] = useState('');
  const [link, setLink] = useState('');
  const [qty, setQty] = useState(1000);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [placeError, setPlaceError] = useState('');

  useEffect(() => {
    api.get('/smm/services')
      .then(r => setAllServices(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoadingSvc(false));
  }, []);

  const platforms = ['All', ...Array.from(new Set(allServices.map(s => s.platform).filter(Boolean))).sort()];
  const services = platform === 'All' ? allServices : allServices.filter(s => s.platform === platform);
  const selected = allServices.find(s => s.id === serviceId);
  const cost = selected && qty > 0 ? parseFloat(((selected.sell_price * qty) / 1000).toFixed(2)) : 0;

  const handlePlace = async () => {
    if (!serviceId || !link || qty < 1) return;
    setPlacing(true); setPlaceError('');
    try {
      await api.post('/smm/order', { service_id: serviceId, link, quantity: qty });
      setPlaced(true); setLink(''); setServiceId(''); setQty(1000);
      user?.refreshUser?.();
      setTimeout(() => setPlaced(false), 4000);
    } catch (err) {
      setPlaceError(err.response?.data?.error || 'Order failed. Check your balance and try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      <div className="pn-page-title">New SMM Order</div>
      <div className="pn-page-sub">Pick a platform, choose a service, and grow your reach.</div>
      {placed && (
        <div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10,fontSize:13}}>
          <i className="ti ti-circle-check" style={{color:'var(--success)',fontSize:18}}/><span style={{color:'var(--text-secondary)'}}>Order placed! Check your Order History.</span>
        </div>
      )}
      {placeError && (
        <div style={{background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:12,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10,fontSize:13}}>
          <i className="ti ti-alert-circle" style={{color:'var(--danger)',fontSize:18}}/><span style={{color:'var(--danger)'}}>{placeError}</span>
        </div>
      )}
      {loadingSvc ? (
        <div style={{padding:'40px 0',textAlign:'center'}}><i className="ti ti-loader-2" style={{fontSize:28,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/></div>
      ) : (
        <>
          <div className="pn-chips-scroll">
            {platforms.map(p => (
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
                Quantity {selected && <span style={{color:'var(--text-muted)',fontWeight:400}}> ({selected.min_quantity?.toLocaleString()} – {selected.max_quantity?.toLocaleString()})</span>}
              </label>
              <div className="pn-qty">
                <button className="pn-qty-btn" onClick={()=>setQty(q=>Math.max(selected?.min_quantity||1,q-100))}>−</button>
                <input className="pn-qty-input" type="number" value={qty} onChange={e=>setQty(Number(e.target.value)||0)} min={selected?.min_quantity||1} max={selected?.max_quantity||9999999}/>
                <button className="pn-qty-btn" onClick={()=>setQty(q=>Math.min(selected?.max_quantity||9999999,q+100))}>+</button>
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
                  <div className="pn-summary-row"><span className="pn-summary-label">Rate</span><span className="pn-summary-value pn-mono">₦{selected?.sell_price}/1k</span></div>
                  <div className="pn-summary-row pn-summary-total"><span className="pn-summary-label">Total</span><span className="pn-summary-value">{fmt(cost)}</span></div>
                </div>
              </>
            )}
            <button className="pn-btn pn-btn-primary pn-btn-full" onClick={handlePlace} disabled={!serviceId||!link||qty<1||placing} style={{opacity:(!serviceId||!link||qty<1)?.5:1}}>
              {placing ? <><i className="ti ti-loader-2" style={{animation:'pn-spin 1s linear infinite'}}/>Placing…</> : <><i className="ti ti-shopping-cart"/>Place Order →</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PAGE: SMS VERIFY ─────────────────────────────────────────────────────────
function SmsVerify() {
  const user = useContext(UserCtx);

  // Service list
  const [services, setServices] = useState([]);
  const [loadingSvcs, setLoadingSvcs] = useState(true);
  const [query, setQuery] = useState('');

  // Selected service & purchase flow
  const [selectedSvc, setSelectedSvc] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [country, setCountry] = useState('');
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  // Active number state
  const [active, setActive] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [code, setCode] = useState('');
  const [polling, setPolling] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    api.get('/sms/services')
      .then(r => setServices(Array.isArray(r.data) ? r.data : []))
      .catch(() => setServices([]))
      .finally(() => setLoadingSvcs(false));
  }, []);

  useEffect(() => {
    if (!selectedSvc) { setPrices([]); setCountry(''); return; }
    setLoadingPrices(true); setCountry(''); setPrices([]);
    api.get(`/sms/prices/${encodeURIComponent(selectedSvc.code)}`)
      .then(r => setPrices(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPrices([]))
      .finally(() => setLoadingPrices(false));
  }, [selectedSvc]);

  useEffect(() => {
    if (!activeOrderId || code) return;
    setPolling(true);
    setPollTimedOut(false);
    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current >= 24) {
        clearInterval(pollRef.current);
        setPolling(false);
        setPollTimedOut(true);
        return;
      }
      try {
        const res = await api.get(`/sms/check/${activeOrderId}`);
        if (res.data.smsCode) {
          setCode(res.data.smsCode);
          setPolling(false);
          clearInterval(pollRef.current);
          user?.refreshUser?.();
        }
      } catch (_) {}
    }, 5000);
    return () => { clearInterval(pollRef.current); setPolling(false); };
  }, [activeOrderId, code]);

  const filtered = query.trim()
    ? services.filter(s => s.name.toLowerCase().includes(query.trim().toLowerCase()))
    : services;

  const selectedCountry = prices.find(p => String(p.countryId ?? p.countryCode ?? p.country) === String(country));
  const cost = selectedCountry ? Number(selectedCountry.price || selectedCountry.cost || 0) : 0;

  const handleSelectSvc = (svc) => {
    setSelectedSvc(prev => prev?.code === svc.code ? null : svc);
    setBuyError('');
  };

  const handleGet = async () => {
    if (!selectedSvc || !country) return;
    setBuying(true); setBuyError('');
    try {
      const res = await api.post('/sms/buy-number', { product: selectedSvc.code, country });
      setActive({ number: res.data.number || res.data.phone, app: selectedSvc.name, country });
      setActiveOrderId(res.data.orderId || res.data.order_id);
      setCode('');
      user?.refreshUser?.();
    } catch (err) {
      setBuyError(err.response?.data?.error || 'Could not get a number. Try a different country.');
    } finally {
      setBuying(false);
    }
  };

  const handleFinish = async () => {
    if (activeOrderId) {
      try { await api.post(`/sms/finish/${activeOrderId}`); } catch (_) {}
    }
    setActive(null); setActiveOrderId(null); setCode(''); setPolling(false); setPollTimedOut(false);
    clearInterval(pollRef.current);
  };

  const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div>
      <div className="pn-page-title">SMS Verify</div>
      <div className="pn-page-sub">Virtual numbers for any platform. Code arrives automatically.</div>

      {active && (
        <div style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.2)',borderRadius:16,padding:20,marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',color:'var(--success)',marginBottom:14}}>Active Number — {active.app}</div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
            <div className="pn-mono" style={{fontSize:22,color:'var(--text-primary)',flex:1}}>{active.number}</div>
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
          ) : pollTimedOut ? (
            <div style={{marginBottom:16,padding:'12px 14px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:10}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <i className="ti ti-clock-x" style={{color:'var(--accent)',fontSize:16}}/>
                <span style={{fontSize:13,fontWeight:600,color:'var(--accent)'}}>No code received (2 min timeout)</span>
              </div>
              <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:10}}>The number may have expired or the SMS was not sent. You can try cancelling and getting a new number.</div>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--text-secondary)',fontSize:13,marginBottom:16}}>
              <i className="ti ti-loader-2" style={{color:'var(--success)',animation:'pn-spin 1s linear infinite'}}/>
              Waiting for SMS code… (checks every 5 seconds)
            </div>
          )}
          <div style={{display:'flex',gap:10}}>
            <button className="pn-btn pn-btn-success" style={{flex:1}} onClick={handleFinish}><i className="ti ti-check"/>Done</button>
            <button className="pn-btn pn-btn-secondary" style={{flex:1,color:'var(--danger)',borderColor:'rgba(248,113,113,.25)'}} onClick={handleFinish}><i className="ti ti-x"/>Cancel</button>
          </div>
        </div>
      )}

      {!active && (
        <>
          <div className="pn-svc-search-wrap">
            <i className="ti ti-search pn-svc-search-icon"/>
            <input
              className="pn-svc-search"
              placeholder="Search WhatsApp, Google, TikTok…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {loadingSvcs ? (
            <div style={{padding:'48px 0',textAlign:'center'}}>
              <i className="ti ti-loader-2" style={{fontSize:26,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/>
              <div style={{fontSize:13,color:'var(--text-muted)',marginTop:10}}>Loading services…</div>
            </div>
          ) : (
            <div className="pn-svc-list">
              {filtered.length === 0 ? (
                <div className="pn-empty" style={{padding:'32px 20px'}}>
                  <i className="ti ti-search pn-empty-icon"/>
                  <div className="pn-empty-title">No services found</div>
                  <div className="pn-empty-sub">Try a different search term</div>
                </div>
              ) : filtered.map(svc => (
                <div
                  key={svc.code}
                  className={`pn-svc-row${selectedSvc?.code===svc.code?' active':''}`}
                  onClick={() => handleSelectSvc(svc)}
                >
                  <ServiceIcon name={svc.name} size={38}/>
                  <div className="pn-svc-info">
                    <div className="pn-svc-name">{svc.name}</div>
                    <div className="pn-svc-meta">{svc.countryCount} countries · {svc.totalCount.toLocaleString()} available</div>
                  </div>
                  <i className={`ti ${selectedSvc?.code===svc.code?'ti-chevron-down':'ti-chevron-right'} pn-svc-chevron`}/>
                </div>
              ))}
            </div>
          )}

          {selectedSvc && (
            <div className="pn-card">
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <ServiceIcon name={selectedSvc.name} size={30}/>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:'var(--text-primary)'}}>{selectedSvc.name}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>Select a country for your number</div>
                </div>
              </div>
              {loadingPrices ? (
                <div style={{padding:'20px 0',textAlign:'center'}}><i className="ti ti-loader-2" style={{fontSize:22,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/></div>
              ) : prices.length === 0 ? (
                <div style={{fontSize:13,color:'var(--text-muted)',padding:'12px 0'}}>No countries available for {selectedSvc.name}. Try another service.</div>
              ) : (
                <div className="pn-input-wrap">
                  <select className="pn-input" value={country} onChange={e=>setCountry(e.target.value)} style={{cursor:'pointer'}}>
                    <option value="">— Select a country —</option>
                    {prices.map(p => {
                      const id = String(p.countryId ?? p.countryCode ?? p.country ?? '');
                      const label = p.countryName || p.country || id;
                      const price = Number(p.price || p.cost || 0);
                      return <option key={id} value={id}>{label} — {fmt(price)}</option>;
                    })}
                  </select>
                </div>
              )}
              {buyError && (
                <div style={{fontSize:12,color:'var(--danger)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                  <i className="ti ti-alert-circle"/>{buyError}
                </div>
              )}
              {cost > 0 && (
                <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:12}}>
                  Cost: <span style={{fontFamily:'monospace',color:'var(--accent)',fontWeight:600}}>{fmt(cost)}</span>
                  {user?.balance < cost && <span style={{color:'var(--danger)',marginLeft:8}}>Insufficient balance</span>}
                </div>
              )}
              <button className="pn-btn pn-btn-primary pn-btn-full" onClick={handleGet} disabled={!country||buying||(user?.balance<cost&&cost>0)}>
                {buying ? <><i className="ti ti-loader-2" style={{animation:'pn-spin 1s linear infinite'}}/>Getting number…</> : <><i className="ti ti-device-mobile"/>Get Number for {selectedSvc.name}</>}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── PAGE: ORDER HISTORY ──────────────────────────────────────────────────────
function OrderHistory() {
  const [tab, setTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // { order, accounts, credLoading, credError }
  const fmtDate = (d) => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [stdRes, accRes] = await Promise.all([
        api.get('/orders', { params: { limit: 50, ...(tab !== 'all' && tab !== 'accounts' ? { type: tab } : {}) } }),
        (tab === 'all' || tab === 'accounts') ? api.get('/accszone/orders') : Promise.resolve({ data: [] }),
      ]);
      const std = (stdRes.data.orders || []).map(o => ({
        ...o,
        amount: o.amount_paid || o.total_cost || 0,
        phone: o.phone_number,
      }));
      const accs = (Array.isArray(accRes.data) ? accRes.data : []).map(o => ({
        ...o,
        type: 'accounts',
        platform: o.platform,
        amount: o.total_cost,
      }));
      const merged = tab === 'accounts' ? accs
        : tab !== 'all' ? std
        : [...std, ...accs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(merged);
      setTotal(merged.length);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [tab]);

  const openDetail = (order) => {
    if (order.type === 'accounts') {
      setDetail({ order, accounts: null, credLoading: true, credError: false });
      api.get(`/accszone/orders/${order.id}`)
        .then(({ data }) => {
          const raw = data.delivered_data;
          const accs = Array.isArray(raw) ? raw : (raw ? [raw] : []);
          setDetail(prev => ({ ...prev, accounts: accs, credLoading: false }));
        })
        .catch(() => setDetail(prev => ({ ...prev, credLoading: false, credError: true })));
    } else {
      setDetail({ order, accounts: null, credLoading: false, credError: false });
    }
  };

  const o = detail?.order;

  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,gap:12}}>
        <div>
          <div className="pn-page-title">Order History</div>
          <div className="pn-page-sub" style={{marginBottom:0}}>{total} total orders</div>
        </div>
        <button className="pn-btn pn-btn-secondary pn-btn-sm" onClick={fetchOrders} disabled={loading}>
          <i className="ti ti-refresh" style={{animation:loading?'pn-spin 1s linear infinite':''}}/>Refresh
        </button>
      </div>
      <div className="pn-tabs">
        {[['all','All'],['smm','SMM'],['sms','SMS'],['accounts','Accounts']].map(([v,l])=>(
          <button key={v} className={`pn-tab${tab===v?' active':''}`} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>
      {loading ? (
        <div style={{padding:'40px 0',textAlign:'center'}}><i className="ti ti-loader-2" style={{fontSize:28,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/></div>
      ) : orders.length === 0 ? (
        <div className="pn-card"><div className="pn-empty"><i className="ti ti-receipt pn-empty-icon"/><div className="pn-empty-title">No orders found</div><div className="pn-empty-sub">Place your first order to see it here</div></div></div>
      ) : (
        <div className="pn-card" style={{padding:0,overflow:'hidden'}}>
          <div className="pn-order-header">
            <span>Date</span><span>Type</span><span>Service / Platform</span><span style={{textAlign:'right'}}>Amount</span>
          </div>
          {orders.map(ord => (
            <div
              key={ord.id}
              className="pn-order-row"
              onClick={() => openDetail(ord)}
              style={{cursor:'pointer',transition:'background 150ms ease'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-raised)'}
              onMouseLeave={e=>e.currentTarget.style.background=''}
            >
              <div className="pn-order-id" style={{fontSize:10}}>{fmtDate(ord.created_at)}</div>
              <div><Badge type={ord.type}/></div>
              <div>
                <div className="pn-order-name" style={{display:'flex',alignItems:'center',gap:6}}>
                  <PlatformIcon name={ord.platform} size={14}/>
                  {ord.type==='accounts' ? (ord.product_name||ord.platform) : ord.type==='sms' ? ord.platform : (ord.service_name||ord.platform||'—')}
                </div>
                <div className="pn-order-sub">
                  {ord.type==='accounts' ? `${ord.quantity||1} account${(ord.quantity||1)>1?'s':''}` :
                   ord.type==='sms' ? (ord.phone||ord.phone_number||'') :
                   (ord.link ? ord.link.slice(0,30)+'…' : ord.status||'')}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                <div className="pn-order-qty">{fmt(ord.amount)}</div>
                <Badge status={ord.status}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Universal order detail modal */}
      {detail && o && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setDetail(null)}>
          <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:20,width:'100%',maxWidth:460,height:'80vh',display:'flex',flexDirection:'column',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{padding:'18px 20px 14px',borderBottom:'1px solid var(--border)',flexShrink:0,display:'flex',alignItems:'center',gap:12}}>
              <PlatformIcon name={o.platform} size={36}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {o.type==='accounts' ? (o.product_name||o.platform) : o.type==='sms' ? `${o.platform} Number` : (o.service_name||o.platform||'Order')}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <Badge type={o.type}/><Badge status={o.status}/>
                </div>
              </div>
              <button onClick={()=>setDetail(null)} style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:8,width:32,height:32,cursor:'pointer',color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                <i className="ti ti-x"/>
              </button>
            </div>

            {/* Body */}
            <div style={{flex:1,overflowY:'auto',overflowX:'hidden',minHeight:0,padding:'16px 20px'}}>

              {/* Order meta grid */}
              <div style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',marginBottom:16}}>
                {[
                  ['Date', fmtDate(o.created_at)],
                  ['Amount Charged', fmt(o.amount)],
                  o.type==='accounts' && o.quantity ? ['Quantity', `${o.quantity} account${o.quantity!==1?'s':''}`] : null,
                  o.type==='accounts' && o.unit_price ? ['Unit Price', fmt(o.unit_price)] : null,
                  o.type==='smm' && o.quantity ? ['Quantity', Number(o.quantity).toLocaleString()] : null,
                  o.type==='smm' && o.link ? ['Link', o.link] : null,
                  o.type==='sms' && (o.phone||o.phone_number) ? ['Phone Number', o.phone||o.phone_number] : null,
                  o.type==='sms' && o.country ? ['Country', o.country] : null,
                  ['Order ID', String(o.id||'').slice(0,20)],
                  o.accszone_order_id ? ['External ID', o.accszone_order_id] : null,
                ].filter(Boolean).map(([label, value], i, arr) => (
                  <div key={label} style={{display:'flex',padding:'9px 14px',background:i%2===0?'transparent':'rgba(255,255,255,.02)',borderBottom:i<arr.length-1?'0.5px solid var(--border)':'none',gap:12}}>
                    <span style={{fontSize:12,color:'var(--text-muted)',width:110,flexShrink:0}}>{label}</span>
                    <span style={{fontSize:12,fontWeight:500,color:'var(--text-primary)',wordBreak:'break-all',flex:1}}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Credentials — accounts only */}
              {o.type === 'accounts' && (
                <>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:10}}>Account Credentials</div>
                  {detail.credLoading && (
                    <div style={{textAlign:'center',padding:'24px 0'}}>
                      <i className="ti ti-loader-2" style={{fontSize:24,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/>
                      <div style={{fontSize:12,color:'var(--text-muted)',marginTop:8}}>Loading credentials…</div>
                    </div>
                  )}
                  {!detail.credLoading && detail.credError && (
                    <div style={{textAlign:'center',padding:'20px 0',color:'var(--danger)',fontSize:13}}>
                      <i className="ti ti-alert-circle" style={{fontSize:24,display:'block',marginBottom:6}}/>Could not load credentials.
                    </div>
                  )}
                  {!detail.credLoading && !detail.credError && (detail.accounts||[]).length === 0 && (
                    <div style={{textAlign:'center',padding:'20px 0',fontSize:12,color:'var(--text-muted)'}}>No credential data stored for this order.</div>
                  )}
                  {!detail.credLoading && !detail.credError && (detail.accounts||[]).map((acc, i) => (
                    <div key={i} style={{marginBottom:12}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--accent)',marginBottom:6}}>Account {i + 1}</div>
                      <div style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:10,padding:'2px 12px'}}>
                        {typeof acc === 'string'
                          ? <CredHistoryRow label="credentials" value={acc}/>
                          : Object.entries(acc).map(([k, v]) => <CredHistoryRow key={k} label={k} value={String(v)}/>)
                        }
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{padding:'12px 20px',borderTop:'1px solid var(--border)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>
                {o.type==='accounts' ? <><i className="ti ti-lock" style={{marginRight:4}}/>Keep credentials private.</> : <><i className="ti ti-info-circle" style={{marginRight:4}}/>Contact support with your Order ID.</>}
              </div>
              <button onClick={()=>setDetail(null)} style={{height:32,padding:'0 14px',background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',color:'var(--text-secondary)',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CredHistoryRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);
  const isSecret = label.toLowerCase().includes('pass') || label.toLowerCase().includes('token');
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'0.5px solid var(--border)'}}>
      <span style={{fontSize:11,color:'var(--text-muted)',width:80,flexShrink:0,fontWeight:500}}>{label}</span>
      <span style={{fontFamily:"'Geist Mono','Courier New',monospace",fontSize:12,color:'var(--text-primary)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
        {isSecret && !show ? '••••••••' : value}
      </span>
      {isSecret && (
        <button onClick={() => setShow(s => !s)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,padding:2}}>
          <i className={`ti ${show ? 'ti-eye-off' : 'ti-eye'}`}/>
        </button>
      )}
      <button onClick={copy} style={{background:'none',border:'none',cursor:'pointer',color:copied?'var(--success)':'var(--text-muted)',fontSize:13,padding:2}}>
        <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`}/>
      </button>
    </div>
  );
}

// ─── PAGE: ADD FUNDS ──────────────────────────────────────────────────────────
function AddFunds() {
  const user = useContext(UserCtx);
  const { updateUser, refreshUser } = useAuth();
  // step: 'amount' | 'method' | 'verifying' | 'success' | 'error'
  const [step, setStep] = useState('amount');
  const [amount, setAmount] = useState('');
  const [selectedAmt, setSelectedAmt] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const flwResult = useRef(null);
  const verifyStarted = useRef(false);
  const QUICK = [500, 1000, 2000, 5000, 10000, 20000];
  const [bankDetails, setBankDetails] = useState([]);
  const [refCode, setRefCode] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const loadTx = () => {
    api.get('/wallet/transactions')
      .then(r => setTransactions(Array.isArray(r.data?.transactions) ? r.data.transactions : []))
      .catch(() => setTransactions([]))
      .finally(() => setTxLoading(false));
  };

  useEffect(() => {
    loadTx();
    api.get('/bank/details').then(r => setBankDetails(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const genRefCode = () => {
    const letters = ((user?.full_name || user?.email || '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3)) || 'PNG';
    return `PNG-${Math.floor(1000 + Math.random() * 9000)}-${letters}`;
  };

  const enterDirectBank = () => { setRefCode(r => r || genRefCode()); setStep('direct'); };

  const loadFlwScript = () => new Promise((resolve, reject) => {
    if (window.FlutterwaveCheckout) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.flutterwave.com/v3.js';
    const flwErr = () => { clearTimeout(timer); reject(Object.assign(new Error('Online payment is not available in your region.'), { flwFailed: true })); };
    const timer = setTimeout(flwErr, 12000);
    s.onerror = flwErr;
    s.onload = () => { clearTimeout(timer); resolve(); };
    document.body.appendChild(s);
  });

  const doVerify = async (transactionId, txRef) => {
    setStep('verifying');
    try {
      const { data } = await api.post('/payment/flutterwave/verify', {
        transaction_id: transactionId,
        tx_ref: txRef,
      });
      setSuccessData({ amount: data.amount, new_balance: data.new_balance });
      if (data.new_balance != null) updateUser({ wallet_balance: data.new_balance });
      refreshUser();
      loadTx();
      setStep('success');
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.includes('Already')) {
        setSuccessData({ amount: parseFloat(amount), new_balance: null });
        refreshUser();
        loadTx();
        setStep('success');
      } else {
        setErrorMsg(msg || 'Payment received but verification failed. Contact support.');
        setStep('error');
      }
    }
  };

  const handlePayWith = async (paymentOption) => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) return;
    setErrorMsg('');
    setLoadingPayment(true);
    try {
      const { data: cfg } = await api.post('/payment/flutterwave/init', { amount: amt });
      await loadFlwScript();
      setLoadingPayment(false);
      flwResult.current = null;
      verifyStarted.current = false;
      window.FlutterwaveCheckout({
        public_key: cfg.public_key,
        tx_ref: cfg.tx_ref,
        amount: amt,
        currency: 'NGN',
        payment_options: paymentOption,
        customer: { email: cfg.customer_email, name: cfg.customer_name },
        customizations: { title: 'PanelNG Wallet', description: 'Add funds to your wallet' },
        callback: (resp) => {
          // resp.id and resp.transaction_id are both the transaction ID depending on SDK version
          const txId = resp.transaction_id || resp.id;
          if ((resp.status === 'successful' || resp.status === 'success' || resp.status === 'completed') && txId) {
            flwResult.current = { transaction_id: txId, tx_ref: resp.tx_ref };
            if (!verifyStarted.current) {
              verifyStarted.current = true;
              // Start verification immediately — doVerify returns a Promise we don't need to await
              doVerify(txId, resp.tx_ref);
            }
          }
        },
        onclose: () => {
          // Primary path: callback already started verification
          if (verifyStarted.current) return;
          // Fallback: callback fired but verify didn't start yet
          if (flwResult.current) {
            verifyStarted.current = true;
            doVerify(flwResult.current.transaction_id, flwResult.current.tx_ref);
          } else {
            // User cancelled or closed without paying
            setStep('method');
          }
        },
      });
    } catch (err) {
      setLoadingPayment(false);
      if (err.flwFailed) {
        enterDirectBank();
        setErrorMsg('Online payment is not available in your region. Bank Deposit below works from any country.');
      } else {
        setErrorMsg(err.response?.data?.error || err.message || 'Could not start payment. Try again.');
      }
    }
  };

  const reset = () => {
    setStep('amount'); setAmount(''); setSelectedAmt(null);
    setSuccessData(null); setErrorMsg(''); setRefCode(''); setSubmitLoading(false);
    flwResult.current = null; verifyStarted.current = false;
  };

  const handleBankSubmit = async () => {
    setSubmitLoading(true); setErrorMsg('');
    try {
      await api.post('/bank/request', { amount: parseFloat(amount), reference: refCode });
      setStep('submitted');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric' });

  const METHODS = [
    { key: 'card', option: 'card', icon: 'ti-credit-card', label: 'Debit / Credit Card', desc: 'Pay instantly with Visa, Mastercard, Verve' },
    { key: 'banktransfer', option: 'banktransfer', icon: 'ti-building-bank', label: 'Bank Transfer', desc: 'Transfer directly from your bank account' },
    { key: 'ussd', option: 'ussd', icon: 'ti-device-mobile', label: 'USSD', desc: 'Pay with *737#, *901# and more' },
  ];

  return (
    <div>
      <div className="pn-page-title">Add Funds</div>
      <div className="pn-page-sub">Fund your wallet to place orders instantly.</div>

      <div className="pn-card">
        {step === 'amount' && (
          <>
            <div className="pn-input-wrap">
              <label className="pn-input-label">Amount (₦)</label>
              <div className="pn-input-with-icon">
                <span className="pn-input-icon pn-mono" style={{fontWeight:500}}>₦</span>
                <input className="pn-input pn-mono" style={{paddingLeft:30,fontSize:18}} type="number" placeholder="0.00" value={amount} onChange={e=>{setAmount(e.target.value);setSelectedAmt(null);setErrorMsg('');}} min={100}/>
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Minimum: ₦100</div>
            </div>
            <label className="pn-input-label">Quick Amounts</label>
            <div className="pn-amount-chips">
              {QUICK.map(a=>(
                <button key={a} className={`pn-achip${selectedAmt===a?' selected':''}`} onClick={()=>{setAmount(String(a));setSelectedAmt(a);}}>₦{a.toLocaleString()}</button>
              ))}
            </div>
            {errorMsg && (
              <div style={{background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'var(--danger)',marginBottom:12}}>
                <i className="ti ti-alert-circle" style={{marginRight:6}}/>{errorMsg}
              </div>
            )}
            <button className="pn-btn pn-btn-primary pn-btn-full" onClick={()=>{if(parseFloat(amount)>=100){setErrorMsg('');setStep('method');}}} disabled={!amount||parseFloat(amount)<100} style={{opacity:(!amount||parseFloat(amount)<100)?.5:1}}>
              Continue <i className="ti ti-arrow-right"/>
            </button>
          </>
        )}

        {step === 'method' && (
          <>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <button className="pn-btn pn-btn-secondary" style={{padding:'6px 12px',minWidth:'unset'}} onClick={()=>setStep('amount')}><i className="ti ti-arrow-left"/></button>
              <div>
                <div style={{fontWeight:600,fontSize:15}}>Choose Payment Method</div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>Paying <strong className="pn-mono">{fmt(parseFloat(amount))}</strong></div>
              </div>
            </div>
            {errorMsg && (
              <div style={{background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'var(--danger)',marginBottom:12}}>
                <i className="ti ti-alert-circle" style={{marginRight:6}}/>{errorMsg}
              </div>
            )}
            {loadingPayment && (
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,marginBottom:12}}>
                <i className="ti ti-loader-2" style={{fontSize:16,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/>
                <span style={{fontSize:13,color:'var(--accent)',fontWeight:500}}>Opening payment — please wait…</span>
              </div>
            )}
            {METHODS.map(m=>(
              <button key={m.key} onClick={()=>handlePayWith(m.option)} disabled={loadingPayment} style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'var(--card-alt,rgba(255,255,255,.04))',border:'1px solid var(--border)',borderRadius:10,marginBottom:10,cursor:loadingPayment?'not-allowed':'pointer',textAlign:'left',transition:'border-color .15s',opacity:loadingPayment?.6:1}}>
                <div style={{width:40,height:40,borderRadius:10,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <i className={`ti ${m.icon}`} style={{fontSize:18,color:'var(--accent)'}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,color:'var(--text-primary)',marginBottom:2}}>{m.label}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{m.desc}</div>
                </div>
                <i className="ti ti-chevron-right" style={{color:'var(--text-muted)',flexShrink:0}}/>
              </button>
            ))}
            <div style={{textAlign:'center',marginTop:8,fontSize:12,color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <i className="ti ti-shield-check" style={{fontSize:14}}/>Secured by Flutterwave
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,margin:'16px 0 10px'}}>
              <div style={{flex:1,height:1,background:'var(--border)'}}/>
              <span style={{fontSize:11,color:'var(--text-muted)',fontWeight:500,whiteSpace:'nowrap'}}>or pay manually</span>
              <div style={{flex:1,height:1,background:'var(--border)'}}/>
            </div>
            <button onClick={enterDirectBank} disabled={loadingPayment} style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:10,cursor:loadingPayment?'not-allowed':'pointer',textAlign:'left',transition:'border-color .15s',opacity:loadingPayment?.6:1}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className="ti ti-building-bank" style={{fontSize:18,color:'var(--success)'}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,color:'var(--text-primary)',marginBottom:2}}>Bank Deposit</div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>Works from any country · Credited within 2 hours</div>
              </div>
              <i className="ti ti-chevron-right" style={{color:'var(--text-muted)',flexShrink:0}}/>
            </button>
          </>
        )}

        {step === 'direct' && (
          <>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <button className="pn-btn pn-btn-secondary" style={{padding:'6px 12px',minWidth:'unset'}} onClick={()=>setStep('method')}><i className="ti ti-arrow-left"/></button>
              <div>
                <div style={{fontWeight:600,fontSize:15}}>Bank Deposit</div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>Sending <strong className="pn-mono">{fmt(parseFloat(amount))}</strong></div>
              </div>
            </div>
            {errorMsg && (
              <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'var(--accent)',marginBottom:14,display:'flex',gap:8,alignItems:'flex-start'}}>
                <i className="ti ti-info-circle" style={{flexShrink:0,marginTop:1}}/>{errorMsg}
              </div>
            )}
            <span className="pn-section-label">1 — Your Unique Reference</span>
            <div style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.2)',borderRadius:12,padding:'14px 16px',marginBottom:16,position:'relative'}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:1,textTransform:'uppercase',color:'var(--success)',marginBottom:8}}>Use as Transfer Narration</div>
              <div style={{fontFamily:"'Geist Mono','Courier New',monospace",fontSize:22,fontWeight:500,color:'var(--success)',letterSpacing:'0.06em'}}>{refCode}</div>
              <button onClick={()=>{navigator.clipboard.writeText(refCode);setCopiedRef(true);setTimeout(()=>setCopiedRef(false),2000);}} style={{position:'absolute',top:12,right:12,background:'none',border:'none',cursor:'pointer',color:'var(--success)',fontSize:16,padding:'6px',borderRadius:6,display:'flex',alignItems:'center'}}>
                <i className={`ti ${copiedRef?'ti-check':'ti-copy'}`}/>
              </button>
            </div>
            <span className="pn-section-label">2 — Send This Exact Amount</span>
            <div style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:12,padding:'16px 20px',textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--accent)',marginBottom:6}}>Transfer Exactly</div>
              <div style={{fontFamily:"'Geist Mono','Courier New',monospace",fontSize:28,fontWeight:500,color:'var(--text-primary)'}}>{fmt(parseFloat(amount))}</div>
            </div>
            <span className="pn-section-label">3 — Bank Account</span>
            {bankDetails.length === 0 ? (
              <div style={{fontSize:13,color:'var(--text-muted)',padding:'8px 0',marginBottom:12}}>Loading bank details…</div>
            ) : bankDetails.map(b => (
              <div key={b.id} style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px',marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:'.8px',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:6}}>{b.bank_name}</div>
                <div style={{fontFamily:"'Geist Mono','Courier New',monospace",fontSize:20,fontWeight:500,color:'var(--text-primary)',letterSpacing:'.05em',marginBottom:3}}>{b.account_number}</div>
                <div style={{fontSize:13,color:'var(--text-secondary)',fontWeight:500}}>{b.account_name}</div>
              </div>
            ))}
            <div style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',fontSize:12,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:14}}>
              <i className="ti ti-info-circle" style={{marginRight:6,color:'var(--accent)'}}/>
              After sending, click below. Your wallet is credited within 2 hours (business hours: 8am–9pm WAT).
            </div>
            <button className="pn-btn pn-btn-primary pn-btn-full" onClick={handleBankSubmit} disabled={submitLoading}>
              {submitLoading ? <><i className="ti ti-loader-2" style={{animation:'pn-spin 1s linear infinite'}}/>Submitting…</> : <><i className="ti ti-check"/>I've Made the Transfer</>}
            </button>
          </>
        )}

        {step === 'submitted' && (
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(245,158,11,.12)',border:'2px solid var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <i className="ti ti-clock" style={{fontSize:28,color:'var(--accent)'}}/>
            </div>
            <div style={{fontSize:17,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>Transfer Submitted</div>
            <div className="pn-mono" style={{fontSize:26,fontWeight:800,color:'var(--accent)',marginBottom:8}}>{fmt(parseFloat(amount))}</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Reference: <span style={{fontFamily:'monospace',color:'var(--text-primary)',fontWeight:600}}>{refCode}</span></div>
            <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:20}}>We'll review and credit your wallet within 2 hours.</div>
            <button className="pn-btn pn-btn-secondary" onClick={reset}>Done</button>
          </div>
        )}

        {step === 'verifying' && (
          <div style={{textAlign:'center',padding:'40px 0'}}>
            <i className="ti ti-loader-2" style={{fontSize:40,color:'var(--accent)',animation:'pn-spin 1s linear infinite',display:'block',marginBottom:16}}/>
            <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Verifying Payment…</div>
            <div style={{fontSize:13,color:'var(--text-muted)'}}>Please wait while we confirm your payment.</div>
          </div>
        )}

        {step === 'success' && (
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(34,197,94,.12)',border:'2px solid var(--success)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <i className="ti ti-circle-check" style={{fontSize:28,color:'var(--success)'}}/>
            </div>
            <div style={{fontSize:17,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>Payment Successful</div>
            {successData?.amount > 0 && (
              <div className="pn-mono" style={{fontSize:26,fontWeight:800,color:'var(--success)',marginBottom:4}}>{fmt(successData.amount)}</div>
            )}
            <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:20}}>Your wallet has been credited instantly.</div>
            <button className="pn-btn pn-btn-secondary" onClick={reset}>Fund Again</button>
          </div>
        )}

        {step === 'error' && (
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(248,113,113,.1)',border:'2px solid var(--danger)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <i className="ti ti-x" style={{fontSize:28,color:'var(--danger)'}}/>
            </div>
            <div style={{fontSize:17,fontWeight:600,color:'var(--danger)',marginBottom:8}}>Verification Failed</div>
            <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:20}}>{errorMsg}</div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="pn-btn pn-btn-primary" onClick={()=>setStep('method')}>Try Again</button>
              <button className="pn-btn pn-btn-secondary" onClick={reset}>Start Over</button>
            </div>
          </div>
        )}
      </div>

      <div style={{marginTop:20}}>
        <span className="pn-section-label">Wallet History</span>
        <div className="pn-card" style={{padding:'0 20px'}}>
          {txLoading ? (
            <div style={{padding:'16px 0',textAlign:'center'}}><i className="ti ti-loader-2" style={{animation:'pn-spin 1s linear infinite',fontSize:18,color:'var(--accent)'}}/></div>
          ) : transactions.length === 0 ? (
            <div style={{padding:'16px 0',textAlign:'center',fontSize:13,color:'var(--text-muted)'}}>No transactions yet.</div>
          ) : transactions.map((tx)=>(
            <div key={tx.id} className="pn-tx-row">
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:tx.type==='credit'?'rgba(14,201,127,.1)':'rgba(248,113,113,.1)'}}>
                  <i className={`ti ${tx.type==='credit'?'ti-arrow-down-left':'ti-arrow-up-right'}`} style={{fontSize:13,color:tx.type==='credit'?'var(--success)':'var(--danger)'}}/>
                </div>
                <div style={{minWidth:0}}>
                  <div className="pn-tx-desc" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description || tx.reference}</div>
                  <div className="pn-tx-date">{fmtDate(tx.created_at)}</div>
                </div>
              </div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontVariantNumeric:'tabular-nums',fontSize:13,flexShrink:0,color:tx.type==='credit'?'var(--success)':'var(--danger)'}}>
                {tx.type==='credit'?'+':'-'}{fmt(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: TRANSACTIONS ───────────────────────────────────────────────────────
function TransactionHistory() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const PAGE_SIZE = 30;

  useEffect(() => {
    api.get('/wallet/transactions', { params: { limit: PAGE_SIZE + 1, offset: 0 } })
      .then(r => {
        const rows = Array.isArray(r.data?.transactions) ? r.data.transactions : [];
        setHasMore(rows.length > PAGE_SIZE);
        setTxns(rows.slice(0, PAGE_SIZE));
        setOffset(PAGE_SIZE);
      })
      .catch(() => setTxns([]))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = () => {
    setLoadingMore(true);
    api.get('/wallet/transactions', { params: { limit: PAGE_SIZE + 1, offset } })
      .then(r => {
        const rows = Array.isArray(r.data?.transactions) ? r.data.transactions : [];
        setHasMore(rows.length > PAGE_SIZE);
        setTxns(prev => [...prev, ...rows.slice(0, PAGE_SIZE)]);
        setOffset(prev => prev + PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '';

  return (
    <div className="pn-page">
      <div style={{marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:800,color:'var(--text-primary)',marginBottom:4}}>All Transactions</div>
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>Your complete wallet activity</div>
      </div>

      <div className="pn-card" style={{padding:'0 4px',overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:'32px 0',textAlign:'center'}}><i className="ti ti-loader-2" style={{fontSize:22,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/></div>
        ) : txns.length === 0 ? (
          <div className="pn-empty"><i className="ti ti-receipt pn-empty-icon"/><div className="pn-empty-title">No transactions yet</div><div className="pn-empty-sub">Your activity will appear here</div></div>
        ) : txns.map((t, i) => {
          const isCredit = t.type === 'credit';
          const st = t.status || 'success';
          const statusPill = { success:['rgba(34,197,94,.12)','var(--success)','Successful'], completed:['rgba(34,197,94,.12)','var(--success)','Successful'], pending:['rgba(245,158,11,.12)','var(--accent)','Pending'], rejected:['rgba(220,38,38,.12)','var(--danger)','Rejected'], processing:['rgba(96,165,250,.12)','var(--info)','Processing'], cancelled:['rgba(220,38,38,.12)','var(--danger)','Cancelled'] };
          const [pillBg, pillFg, pillLabel] = statusPill[st] || statusPill.success;
          const iconBg = st === 'pending' ? 'rgba(245,158,11,.1)' : st === 'rejected' ? 'rgba(248,113,113,.1)' : isCredit ? 'rgba(34,197,94,.1)' : 'rgba(248,113,113,.1)';
          const iconColor = st === 'pending' ? 'var(--accent)' : st === 'rejected' ? 'var(--danger)' : isCredit ? 'var(--success)' : 'var(--danger)';
          const icon = st === 'pending' ? 'ti-clock' : st === 'rejected' ? 'ti-x' : isCredit ? 'ti-arrow-down-left' : 'ti-arrow-up-right';
          const amtColor = isCredit && st !== 'rejected' ? 'var(--success)' : 'var(--danger)';
          return (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(t)}
              onKeyDown={e => e.key === 'Enter' && setSelected(t)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:i<txns.length-1?'0.5px solid var(--border)':'none',cursor:'pointer',transition:'background 150ms ease'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-raised)'}
              onMouseLeave={e=>e.currentTarget.style.background=''}
            >
              <div style={{width:36,height:36,borderRadius:10,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className={`ti ${icon}`} style={{fontSize:15,color:iconColor}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.description || t.reference}</div>
                <div style={{fontSize:10,color:'var(--text-muted)'}}>{fmtDate(t.created_at)}</div>
              </div>
              <div style={{flexShrink:0,textAlign:'right',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
                <div style={{fontSize:13,fontWeight:700,color:amtColor,fontVariantNumeric:'tabular-nums'}}>{isCredit && st !== 'rejected' ? '+' : '-'}₦{Number(t.amount).toLocaleString('en-NG',{minimumFractionDigits:2})}</div>
                <span style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:10,background:pillBg,color:pillFg,letterSpacing:'0.02em'}}>{pillLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div style={{textAlign:'center',marginTop:12}}>
          <button
            className="pn-btn pn-btn-secondary"
            onClick={loadMore}
            disabled={loadingMore}
            style={{minWidth:140}}
          >
            {loadingMore ? <><i className="ti ti-loader-2" style={{animation:'pn-spin 1s linear infinite'}}/>Loading…</> : <><i className="ti ti-chevrons-down"/>Load more</>}
          </button>
        </div>
      )}

      {selected && <TxDetailSheet tx={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

// ─── PAGE: PROFILE ────────────────────────────────────────────────────────────
function ProfileSettings() {
  const { theme, setTheme } = useContext(ThemeCtx);
  const user = useContext(UserCtx) || MOCK.user;
  const [name, setName] = useState(user.name);
  const [showPw, setShowPw] = useState({ cur:false, nw:false, cf:false });
  const [pw, setPw] = useState({ cur:'', nw:'', cf:'' });
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState(null); // { ok, text }
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setNameSaving(true); setNameMsg(null);
    try {
      await api.patch('/auth/profile', { full_name: name.trim() });
      setNameMsg({ ok: true, text: 'Name updated successfully.' });
    } catch (e) {
      setNameMsg({ ok: false, text: e.response?.data?.error || 'Failed to save. Try again.' });
    } finally { setNameSaving(false); }
  };

  const handleChangePw = async () => {
    if (!pw.cur || !pw.nw || !pw.cf) return setPwMsg({ ok: false, text: 'All fields are required.' });
    if (pw.nw !== pw.cf) return setPwMsg({ ok: false, text: 'New passwords do not match.' });
    if (pw.nw.length < 8) return setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' });
    setPwSaving(true); setPwMsg(null);
    try {
      await api.patch('/auth/change-password', { current_password: pw.cur, new_password: pw.nw });
      setPwMsg({ ok: true, text: 'Password changed successfully.' });
      setPw({ cur:'', nw:'', cf:'' });
    } catch (e) {
      setPwMsg({ ok: false, text: e.response?.data?.error || 'Password change failed. Try again.' });
    } finally { setPwSaving(false); }
  };

  return (
    <div>
      <div className="pn-page-title">Account Settings</div>
      <div className="pn-page-sub">Manage your profile, security, and preferences.</div>

      {/* Profile card */}
      <div className="pn-card" style={{marginBottom:16}}>
        <div className="pn-profile-head">
          <div className="pn-avatar-lg">{user.initials}</div>
          <div className="pn-profile-name">{user.name}</div>
          <div className="pn-profile-email">{user.email}</div>
          <div className="pn-meta-badges">
            <span className="pn-badge-role">{user.role}</span>
          </div>
        </div>
        <span className="pn-section-label">Personal Information</span>
        <div className="pn-input-wrap">
          <label className="pn-input-label">Full Name</label>
          <input className="pn-input" value={name} onChange={e=>setName(e.target.value)}/>
        </div>
        <div className="pn-input-wrap">
          <label className="pn-input-label">Email Address</label>
          <input className="pn-input" value={user.email} disabled style={{opacity:.45}}/>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Email cannot be changed</div>
        </div>
        {nameMsg && (
          <div style={{background:nameMsg.ok?'rgba(34,197,94,.08)':'rgba(220,38,38,.08)',border:`1px solid ${nameMsg.ok?'rgba(34,197,94,.2)':'rgba(220,38,38,.2)'}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:nameMsg.ok?'var(--success)':'var(--danger)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <i className={`ti ${nameMsg.ok?'ti-circle-check':'ti-alert-circle'}`}/>{nameMsg.text}
          </div>
        )}
        <button className="pn-btn pn-btn-primary pn-btn-full" onClick={handleSaveName} disabled={nameSaving}>
          {nameSaving ? <><i className="ti ti-loader-2" style={{animation:'pn-spin 1s linear infinite'}}/>Saving…</> : <><i className="ti ti-device-floppy"/>Save Changes</>}
        </button>
      </div>

      {/* Change password card */}
      <div className="pn-card" style={{marginBottom:16}}>
        <span className="pn-section-label">Change Password</span>
        {(['cur','nw','cf']).map((k,i)=>(
          <div key={k} className="pn-input-wrap">
            <label className="pn-input-label">{['Current Password','New Password','Confirm New Password'][i]}</label>
            <div className="pn-input-eye-wrap">
              <input className="pn-input" type={showPw[k]?'text':'password'} placeholder={['Your current password','Min. 8 characters','Repeat new password'][i]} value={pw[k]} onChange={e=>setPw({...pw,[k]:e.target.value})}/>
              <button className="pn-input-eye" onClick={()=>setShowPw({...showPw,[k]:!showPw[k]})}><i className={`ti ${showPw[k]?'ti-eye-off':'ti-eye'}`}/></button>
            </div>
          </div>
        ))}
        {pwMsg && (
          <div style={{background:pwMsg.ok?'rgba(34,197,94,.08)':'rgba(220,38,38,.08)',border:`1px solid ${pwMsg.ok?'rgba(34,197,94,.2)':'rgba(220,38,38,.2)'}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:pwMsg.ok?'var(--success)':'var(--danger)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <i className={`ti ${pwMsg.ok?'ti-circle-check':'ti-alert-circle'}`}/>{pwMsg.text}
          </div>
        )}
        <button className="pn-btn pn-btn-secondary pn-btn-full" onClick={handleChangePw} disabled={pwSaving}>
          {pwSaving ? <><i className="ti ti-loader-2" style={{animation:'pn-spin 1s linear infinite'}}/>Updating…</> : <><i className="ti ti-lock"/>Update Password</>}
        </button>
      </div>

      {/* Appearance card */}
      <div className="pn-card" style={{marginBottom:16}}>
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

      {/* Sign Out card */}
      <div className="pn-card">
        <span className="pn-section-label">Account</span>
        <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:16}}>You are signed in as <strong style={{color:'var(--text-primary)'}}>{user.email}</strong>.</p>
        {!confirmSignOut ? (
          <button className="pn-btn-signout" style={{width:'100%',justifyContent:'center',padding:'12px 16px',fontSize:14,borderRadius:12}} onClick={()=>setConfirmSignOut(true)}>
            <i className="ti ti-logout"/>Sign Out
          </button>
        ) : (
          <div style={{background:'rgba(220,38,38,.06)',border:'1px solid rgba(220,38,38,.15)',borderRadius:12,padding:16}}>
            <div style={{fontSize:13,color:'var(--text-secondary)',marginBottom:14,textAlign:'center'}}>Are you sure you want to sign out?</div>
            <div style={{display:'flex',gap:10}}>
              <button className="pn-btn pn-btn-ghost pn-btn-full" onClick={()=>setConfirmSignOut(false)}>Cancel</button>
              <button className="pn-btn pn-btn-full" style={{background:'var(--danger)',color:'#fff',border:'none',borderRadius:10,height:42,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}} onClick={user.logout}>
                <i className="ti ti-logout"/>Yes, Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SUPPORT CHAT ─────────────────────────────────────────────────────────────
const FALLBACK_TOPICS = [
  { id:'funding',  icon:'ti-wallet',         label:'Wallet & Funding',    reply:"To fund your wallet: go to Add Funds → Bank Transfer, follow the steps, and your wallet will be credited within minutes during business hours." },
  { id:'order',    icon:'ti-package',         label:'Order Not Delivered', reply:"Orders usually process within seconds. Check Order History for status. If still pending after 30 minutes, tap \"I still need help\"." },
  { id:'other',    icon:'ti-help-circle',     label:'Something Else',      reply:null, escalate:true },
];

function SupportChat() {
  const user = useContext(UserCtx);
  const [open, setOpen] = useState(false);
  const [botTopics, setBotTopics] = useState(FALLBACK_TOPICS);
  const [phase, setPhase] = useState('greeting'); // greeting | topics | bot-reply | escalating | human
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hovered, setHovered] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const btnRef = useRef(null);

  const BTN = 52;
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return { left: 0, top: 0 };
    const mob = window.innerWidth <= 768;
    return {
      left: window.innerWidth - BTN - (mob ? 12 : 24),
      top: window.innerHeight - BTN - (mob ? 76 : 24),
    };
  });

  const PANEL_W = typeof window !== 'undefined' ? Math.min(360, window.innerWidth - 24) : 360;
  const PANEL_H = 480;
  const panelTop = pos.top >= PANEL_H + 12 ? pos.top - PANEL_H - 12 : pos.top + BTN + 12;
  const panelLeft = typeof window !== 'undefined'
    ? Math.max(8, Math.min(window.innerWidth - PANEL_W - 8, pos.left + BTN - PANEL_W))
    : pos.left;

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 60);

  // Re-fetch bot topics every time the chat opens so admin edits appear immediately
  useEffect(() => {
    if (!open) return;
    api.get('/support/bot-topics')
      .then(r => { if (Array.isArray(r.data) && r.data.length > 0) setBotTopics(r.data); })
      .catch(() => {});
  }, [open]);

  // Poll messages while in human phase and chat is open
  useEffect(() => {
    if (phase !== 'human' || !convId || !open) return;
    const poll = async () => {
      try {
        const { data } = await api.get(`/support/${convId}/messages`);
        setMessages(data.messages || []);
        scrollBottom();
      } catch (_) {}
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, [phase, convId, open]);

  const handleTopic = async (topic) => {
    setSelectedTopic(topic);
    if (topic.escalate) {
      await escalate(topic.label);
    } else {
      setPhase('bot-reply');
    }
  };

  const escalate = async (subject) => {
    setPhase('escalating');
    try {
      let id = convId;
      if (!id) {
        const { data: conv } = await api.post('/support/start');
        id = conv.id;
        setConvId(id);
      }
      await api.patch(`/support/${id}/escalate`, { subject });
      setMessages([]);
      setPhase('human');
      scrollBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      setPhase('topics');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !convId || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);
    const temp = { id:`t-${Date.now()}`, sender_type:'user', body, created_at:new Date().toISOString() };
    setMessages(prev => [...prev, temp]);
    scrollBottom();
    try {
      const { data } = await api.post(`/support/${convId}/message`, { body });
      setMessages(prev => prev.map(m => m.id === temp.id ? data : m));
    } catch (_) {
      setMessages(prev => prev.filter(m => m.id !== temp.id));
      setInput(body);
    }
    setSending(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const reset = () => { setPhase('greeting'); setSelectedTopic(null); setConvId(null); setMessages([]); setInput(''); };

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    let drag = null;

    // All listeners on window — events bubble here from any element.
    // No setPointerCapture (broken on some Android), no preventDefault
    // (blocks events on iOS), no passive:false (Chrome intervention).
    // touch-action:none CSS on the button prevents browser scroll for
    // this touch sequence so we never need to call preventDefault.
    const onDown = (e) => {
      if (!btn.contains(e.target)) return;
      drag = { pid: e.pointerId, sx: e.clientX, sy: e.clientY,
               baseRect: btn.getBoundingClientRect(), moved: false, lastX: 0, lastY: 0 };
    };

    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) drag.moved = true;
      if (drag.moved) {
        const r = drag.baseRect;
        const cx = Math.max(-r.left, Math.min(window.innerWidth  - BTN - r.left, dx));
        const cy = Math.max(-r.top,  Math.min(window.innerHeight - BTN - r.top,  dy));
        btn.style.transform = `translate(${cx}px,${cy}px)`;
        drag.lastX = cx;
        drag.lastY = cy;
      }
    };

    const onUp = (e) => {
      if (!drag) return;
      if (e.type !== 'pointercancel' && e.pointerId !== drag.pid) return;
      const { moved, baseRect, lastX, lastY } = drag;
      drag = null;
      if (e.type === 'pointercancel') { btn.style.transform = ''; return; }
      if (moved) {
        btn.style.left      = (baseRect.left + lastX) + 'px';
        btn.style.top       = (baseRect.top  + lastY) + 'px';
        btn.style.transform = '';
        setPos({ left: baseRect.left + lastX, top: baseRect.top + lastY });
      } else {
        btn.style.transform = '';
        setOpen(v => !v);
      }
    };

    window.addEventListener('pointerdown',   onDown, { passive: true });
    window.addEventListener('pointermove',   onMove, { passive: true });
    window.addEventListener('pointerup',     onUp,   { passive: true });
    window.addEventListener('pointercancel', onUp,   { passive: true });

    return () => {
      window.removeEventListener('pointerdown',   onDown);
      window.removeEventListener('pointermove',   onMove);
      window.removeEventListener('pointerup',     onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <>
      {/* Chat panel — follows button position */}
      {open && (
        <div style={{position:'fixed',top:panelTop,left:panelLeft,width:PANEL_W,height:PANEL_H,background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:16,boxShadow:'0 8px 40px rgba(0,0,0,.28)',display:'flex',flexDirection:'column',zIndex:9998,overflow:'hidden',fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

          {/* Header */}
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'var(--bg-surface)'}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(245,158,11,.15)',border:'1px solid rgba(245,158,11,.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className="ti ti-headset" style={{fontSize:18,color:'var(--accent)'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',lineHeight:1.2}}>PanelNG Support</div>
              <div style={{fontSize:11,color:'var(--success)',display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'var(--success)',display:'inline-block'}}/>
                {phase==='human'?'Connected to support':'Typically replies within minutes'}
              </div>
            </div>
            {phase!=='greeting'&&phase!=='escalating'&&(
              <button onClick={reset} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,padding:'4px 8px',borderRadius:6}}>
                <i className="ti ti-refresh" style={{fontSize:14}}/>
              </button>
            )}
            <button onClick={()=>setOpen(false)} style={{width:28,height:28,background:'var(--bg-raised)',border:'none',borderRadius:8,cursor:'pointer',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-x" style={{fontSize:14}}/>
            </button>
          </div>

          {/* Body */}
          <div style={{flex:1,overflowY:'auto',overflowX:'hidden',minHeight:0,padding:'16px 14px'}}>

            {/* GREETING */}
            {phase==='greeting'&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <div style={{width:30,height:30,borderRadius:10,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                    <i className="ti ti-robot" style={{fontSize:15,color:'var(--accent-text)'}}/>
                  </div>
                  <div style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:'4px 12px 12px 12px',padding:'10px 14px',fontSize:13,color:'var(--text-primary)',lineHeight:1.6,maxWidth:'85%'}}>
                    Hi <strong>{user?.name?.split(' ')[0]||'there'}</strong>! How can we help you today?
                  </div>
                </div>
                <button onClick={()=>setPhase('topics')} style={{alignSelf:'flex-start',marginLeft:40,padding:'8px 14px',background:'var(--accent)',color:'var(--accent-text)',border:'none',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  Get Help <i className="ti ti-arrow-right" style={{fontSize:11,marginLeft:4}}/>
                </button>
              </div>
            )}

            {/* TOPICS */}
            {phase==='topics'&&(
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:4}}>
                  <div style={{width:30,height:30,borderRadius:10,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                    <i className="ti ti-robot" style={{fontSize:15,color:'var(--accent-text)'}}/>
                  </div>
                  <div style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:'4px 12px 12px 12px',padding:'10px 14px',fontSize:13,color:'var(--text-primary)',lineHeight:1.6,maxWidth:'85%'}}>
                    Select a topic below and I'll help right away:
                  </div>
                </div>
                {botTopics.map(t=>(
                  <button key={t.id} onClick={()=>handleTopic(t)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',color:'var(--text-primary)',fontSize:13,fontWeight:500,textAlign:'left',transition:'all 120ms ease',fontFamily:"'Plus Jakarta Sans',sans-serif"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='rgba(245,158,11,.08)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-raised)'}}>
                    <i className={`ti ${t.icon}`} style={{fontSize:16,color:'var(--accent)',flexShrink:0}}/>
                    {t.label}
                    <i className="ti ti-chevron-right" style={{fontSize:12,color:'var(--text-muted)',marginLeft:'auto'}}/>
                  </button>
                ))}
              </div>
            )}

            {/* BOT REPLY */}
            {phase==='bot-reply'&&selectedTopic&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <div style={{width:30,height:30,borderRadius:10,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                    <i className="ti ti-robot" style={{fontSize:15,color:'var(--accent-text)'}}/>
                  </div>
                  <div style={{background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:'4px 12px 12px 12px',padding:'12px 14px',fontSize:13,color:'var(--text-primary)',lineHeight:1.7,maxWidth:'90%'}}>
                    {selectedTopic.reply}
                  </div>
                </div>
                <div style={{marginLeft:40,fontSize:12,color:'var(--text-muted)',marginTop:4}}>Did that help?</div>
                <div style={{marginLeft:40,display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={()=>setOpen(false)} style={{padding:'7px 14px',background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.25)',borderRadius:20,fontSize:12,fontWeight:600,color:'var(--success)',cursor:'pointer'}}>
                    <i className="ti ti-thumb-up" style={{marginRight:5,fontSize:12}}/>Yes, thanks!
                  </button>
                  <button onClick={()=>escalate(selectedTopic.label)} style={{padding:'7px 14px',background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)',borderRadius:20,fontSize:12,fontWeight:600,color:'var(--accent)',cursor:'pointer'}}>
                    <i className="ti ti-headset" style={{marginRight:5,fontSize:12}}/>I still need help
                  </button>
                </div>
              </div>
            )}

            {/* ESCALATING */}
            {phase==='escalating'&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:10,color:'var(--text-secondary)',fontSize:13}}>
                <i className="ti ti-loader-2" style={{fontSize:26,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/>
                Connecting you to support…
              </div>
            )}

            {/* HUMAN CHAT */}
            {phase==='human'&&(
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <div style={{textAlign:'center',marginBottom:12}}>
                  <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:20,padding:'3px 10px',display:'inline-block'}}>
                    You're connected — a team member will be with you shortly
                  </span>
                </div>
                {messages.length===0&&(
                  <div style={{textAlign:'center',padding:'20px 0',fontSize:13,color:'var(--text-muted)'}}>
                    Send a message to start the conversation.
                  </div>
                )}
                {messages.map(m=>(
                  <div key={m.id} style={{display:'flex',justifyContent:m.sender_type==='user'?'flex-end':'flex-start',marginBottom:6}}>
                    {m.sender_type!=='user'&&(
                      <div style={{width:26,height:26,borderRadius:8,background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginRight:6,alignSelf:'flex-end'}}>
                        <i className="ti ti-headset" style={{fontSize:13,color:'var(--accent-text)'}}/>
                      </div>
                    )}
                    <div style={{maxWidth:'78%',padding:'9px 12px',borderRadius:m.sender_type==='user'?'12px 4px 12px 12px':'4px 12px 12px 12px',background:m.sender_type==='user'?'var(--accent)':'var(--bg-raised)',border:m.sender_type==='user'?'none':'1px solid var(--border)',color:m.sender_type==='user'?'var(--accent-text)':'var(--text-primary)',fontSize:13,lineHeight:1.55,wordBreak:'break-word'}}>
                      {m.body}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>
            )}
          </div>

          {/* Input bar — human phase only */}
          {phase==='human'&&(
            <div style={{padding:'10px 12px',borderTop:'1px solid var(--border)',display:'flex',gap:8,alignItems:'flex-end',flexShrink:0,background:'var(--bg-surface)'}}>
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Type a message…" rows={1} style={{flex:1,resize:'none',background:'var(--bg-raised)',border:'1px solid var(--border)',borderRadius:10,padding:'9px 12px',fontSize:13,color:'var(--text-primary)',fontFamily:"'Plus Jakarta Sans',sans-serif",outline:'none',lineHeight:1.5,maxHeight:80,overflowY:'auto'}}/>
              <button onClick={sendMessage} disabled={!input.trim()||sending} style={{width:36,height:36,borderRadius:10,background:'var(--accent)',border:'none',cursor:!input.trim()||sending?'not-allowed':'pointer',opacity:!input.trim()||sending?.5:1,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'opacity 120ms'}}>
                <i className="ti ti-send" style={{fontSize:16,color:'var(--accent-text)'}}/>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating button — draggable, tap to open/close */}
      <button
        ref={btnRef}
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
        style={{
          position:'fixed',
          left:pos.left,
          top:pos.top,
          width:BTN,
          height:BTN,
          borderRadius:'50%',
          background:'var(--accent)',
          border:'none',
          cursor:'pointer',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          boxShadow:'0 4px 20px rgba(0,0,0,.25)',
          zIndex:9999,
          transition:'opacity 200ms ease, box-shadow 180ms ease',
          opacity: open || hovered ? 1 : 0.75,
          touchAction:'none',
          userSelect:'none',
          WebkitUserSelect:'none',
        }}
        aria-label={open?'Close support chat':'Open support chat'}
      >
        <i className={`ti ${open?'ti-x':'ti-message-circle'}`} style={{fontSize:22,color:'var(--accent-text)',transition:'all 180ms ease'}}/>
      </button>
    </>
  );
}

// ─── PAGE: NEW ORDER SELECT ───────────────────────────────────────────────────
function NewOrderSelect({ setPage }) {
  const SERVICES = [
    {
      id: 'smm',
      icon: 'ti-social',
      label: 'SMM Order',
      desc: 'Boost followers, likes, views & more on any social platform',
      color: '#6366F1',
      bg: '#EEF2FF',
    },
    {
      id: 'sms',
      icon: 'ti-device-mobile-message',
      label: 'SMS Verify',
      desc: 'Get virtual numbers to verify any app or service instantly',
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      id: 'accounts',
      icon: 'ti-shopping-bag',
      label: 'Buy Accounts',
      desc: 'Purchase aged, verified social media accounts in bulk',
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
  ];
  return (
    <div style={{padding:'24px 16px',maxWidth:480,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:700,color:'var(--text-primary)'}}>New Order</h2>
        <p style={{margin:'4px 0 0',fontSize:14,color:'var(--text-secondary)'}}>Choose a service to get started</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {SERVICES.map(s => (
          <button
            key={s.id}
            onClick={() => setPage(s.id)}
            style={{
              display:'flex',alignItems:'center',gap:16,
              background:'var(--bg-surface)',border:'1.5px solid var(--border)',
              borderRadius:16,padding:'18px 20px',cursor:'pointer',
              textAlign:'left',width:'100%',transition:'box-shadow 120ms',
            }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
          >
            <div style={{
              width:52,height:52,borderRadius:14,
              background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
            }}>
              <i className={`ti ${s.icon}`} style={{fontSize:26,color:s.color}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:16,color:'var(--text-primary)',marginBottom:3}}>{s.label}</div>
              <div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.45}}>{s.desc}</div>
            </div>
            <i className="ti ti-chevron-right" style={{fontSize:18,color:'var(--text-secondary)',flexShrink:0}}/>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE: REFERRAL ──────────────────────────────────────────────────────────
function Referral() {
  const user = useContext(UserCtx) || MOCK.user;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  const referralLink = `${window.location.origin}/register?ref=${user.referral_code || ''}`;

  const loadStats = () => {
    setLoading(true);
    api.get('/referral/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats({ referral_code: user.referral_code, referral_count: 0, referral_balance: 0, referred_users: [] }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  const copyToClipboard = (text, onDone) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(onDone).catch(() => {
        // Fallback for browsers that block clipboard API
        const el = document.createElement('textarea');
        el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
        document.body.appendChild(el); el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        onDone();
      });
    } else {
      const el = document.createElement('textarea');
      el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
      document.body.appendChild(el); el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      onDone();
    }
  };

  const handleCopyCode = () => {
    const text = stats?.referral_code || user.referral_code || '';
    if (!text) return;
    copyToClipboard(text, () => { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); });
  };

  const handleCopyLink = () => {
    copyToClipboard(referralLink, () => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); });
  };

  const handleWithdraw = async () => {
    if (withdrawing) return;
    setWithdrawing(true); setWithdrawMsg('');
    try {
      const r = await api.post('/referral/withdraw');
      setWithdrawMsg(r.data.message || 'Transferred to wallet!');
      loadStats();
      user.refreshUser?.();
    } catch (err) {
      setWithdrawMsg(err.response?.data?.error || 'Withdrawal failed.');
    } finally {
      setWithdrawing(false);
    }
  };

  const refCode = stats?.referral_code || user.referral_code || '—';
  const refCount = stats?.referral_count || 0;
  const refBal = Number(stats?.referral_balance || 0);
  const referredUsers = stats?.referred_users || [];

  return (
    <div>
      <div className="pn-page-title">Referral Program</div>
      <div className="pn-page-sub">Invite friends and earn when they join PanelNG.</div>

      {/* Referral code card */}
      <div className="pn-card" style={{marginBottom:16}}>
        <div className="pn-section-label" style={{marginBottom:6}}>Your Referral Code</div>
        <div className="pn-ref-code-row">
          <span className="pn-ref-code-val">{refCode}</span>
          <button className="pn-copy-btn" onClick={handleCopyCode}>
            {copiedCode ? <><i className="ti ti-check" style={{fontSize:12}}/> Copied!</> : <><i className="ti ti-copy" style={{fontSize:12}}/> Copy</>}
          </button>
        </div>
        <div className="pn-section-label" style={{marginTop:14,marginBottom:6}}>Referral Link</div>
        <div className="pn-ref-code-row">
          <span className="pn-ref-code-val" style={{fontSize:12,color:'var(--text-secondary)'}}>{referralLink}</span>
          <button className="pn-copy-btn" onClick={handleCopyLink} style={copiedLink ? {background:'var(--accent)',color:'#fff',borderColor:'var(--accent)'} : {}}>
            {copiedLink ? <><i className="ti ti-check" style={{fontSize:12}}/> Copied!</> : <><i className="ti ti-link" style={{fontSize:12}}/> Copy Link</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{textAlign:'center',padding:'24px 0'}}><i className="ti ti-loader-2" style={{fontSize:22,color:'var(--accent)',animation:'pn-spin 1s linear infinite'}}/></div>
      ) : (
        <>
          <div className="pn-ref-stats">
            <div className="pn-ref-stat">
              <div className="pn-ref-stat-label">People Referred</div>
              <div className="pn-ref-stat-val">{refCount}</div>
            </div>
            <div className="pn-ref-stat">
              <div className="pn-ref-stat-label">Referral Earnings</div>
              <div className={`pn-ref-stat-val${refBal > 0 ? ' success' : ''}`}>{fmt(refBal)}</div>
            </div>
          </div>

          {/* Withdraw */}
          {refBal > 0 && (
            <div style={{marginBottom:16}}>
              <button
                className="pn-btn pn-btn-success pn-btn-full"
                onClick={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? <><i className="ti ti-loader-2" style={{fontSize:15,animation:'pn-spin 1s linear infinite'}}/> Transferring…</> : <><i className="ti ti-wallet" style={{fontSize:15}}/>Withdraw {fmt(refBal)} to Wallet</>}
              </button>
              {withdrawMsg && (
                <div style={{marginTop:10,padding:'10px 14px',borderRadius:10,background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',fontSize:13,color:'var(--success)'}}>{withdrawMsg}</div>
              )}
            </div>
          )}

          {/* Referred users list */}
          <div className="pn-section">
            <span className="pn-section-label">People You've Referred</span>
            {referredUsers.length === 0 ? (
              <div className="pn-empty">
                <i className="ti ti-users pn-empty-icon"/>
                <div className="pn-empty-title">No referrals yet</div>
                <div className="pn-empty-sub">Share your link and start earning when friends sign up</div>
              </div>
            ) : (
              <div className="pn-ref-list">
                {referredUsers.map((u, i) => (
                  <div key={i} className="pn-ref-list-item">
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:8,background:'rgba(139,92,246,.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <i className="ti ti-user" style={{fontSize:16,color:'#8B5CF6'}}/>
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{u.full_name || 'Anonymous'}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(u.created_at).toLocaleDateString('en-NG')}</div>
                      </div>
                    </div>
                    <span className="pn-badge pn-badge-success">Joined</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PWA INSTALL BANNER ───────────────────────────────────────────────────────
function InstallBanner() {
  const [show, setShow]   = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const prompt = useRef(null);

  useEffect(() => {
    // Already installed as standalone PWA — nothing to do
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return;

    // Dismissed recently (7 days)
    const ts = localStorage.getItem('pwa_install_dismissed');
    if (ts && Date.now() - parseInt(ts) < 7 * 24 * 60 * 60 * 1000) return;

    const ios       = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const iosSafari = ios && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (iosSafari) {
      setIsIOS(true);
      setTimeout(() => setShow(true), 3000); // slight delay so it doesn't open immediately
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      prompt.current = e;
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setShow(false);
  };

  const install = async () => {
    if (!prompt.current) return;
    prompt.current.prompt();
    const { outcome } = await prompt.current.userChoice;
    prompt.current = null;
    if (outcome === 'accepted') setShow(false);
    else dismiss();
  };

  if (!show) return null;

  return (
    <div style={{
      position:'fixed', bottom:72, left:12, right:12, zIndex:9997,
      background:'var(--bg-surface)', border:'1px solid var(--border)',
      borderRadius:16, padding:'14px 16px',
      boxShadow:'0 8px 32px rgba(0,0,0,.4)',
      display:'flex', alignItems:'center', gap:12,
      fontFamily:"'Plus Jakarta Sans',sans-serif",
    }}>
      <div style={{width:44,height:44,borderRadius:12,background:'#F59E0B',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <i className="ti ti-bolt" style={{fontSize:22,color:'#fff'}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--text-primary)',marginBottom:3}}>
          Add PanelNG to Home Screen
        </div>
        {isIOS ? (
          <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.55}}>
            Tap <i className="ti ti-share" style={{fontSize:12,verticalAlign:'middle'}}/> <strong>Share</strong> at the bottom of Safari, then <strong>"Add to Home Screen"</strong>
          </div>
        ) : (
          <div style={{fontSize:11,color:'var(--text-secondary)'}}>
            Install for faster access, offline use, and no browser chrome
          </div>
        )}
      </div>
      {!isIOS && (
        <button onClick={install} style={{background:'#F59E0B',color:'#0F0F0D',border:'none',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Install
        </button>
      )}
      <button onClick={dismiss} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:'4px',display:'flex',alignItems:'center',flexShrink:0}}>
        <i className="ti ti-x" style={{fontSize:16}}/>
      </button>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function App() {
  const { resolved } = useContext(ThemeCtx);
  const { updateUser, refreshUser } = useAuth();
  const [page, setPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = (p) => { setPage(p); setSidebarOpen(false); };
  const user = useContext(UserCtx) || MOCK.user;
  const handlePurchaseComplete = (data) => {
    if (data?.new_balance != null) updateUser({ wallet_balance: data.new_balance });
    refreshUser();
  };
  const PAGES = { overview: <Overview setPage={setPage}/>, neworder: <NewOrderSelect setPage={navigate}/>, smm: <NewOrder/>, sms: <SmsVerify/>, accounts: <BuyAccounts balance={user.balance} token={localStorage.getItem('panelng_token')} onNavigate={navigate} onPurchaseComplete={handlePurchaseComplete}/>, orders: <OrderHistory/>, funds: <AddFunds/>, transactions: <TransactionHistory/>, referral: <Referral/>, profile: <ProfileSettings/> };
  return (
    <div className="pn-root" data-theme={resolved}>
      <div className="pn-shell">
        <div className={`pn-overlay${sidebarOpen?' show':''}`} onClick={()=>setSidebarOpen(false)}/>
        <Sidebar page={page} setPage={navigate} isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} isMobile={true}/>
        <div className="pn-main">
          <Topbar onMenuClick={()=>setSidebarOpen(true)} onLogoClick={()=>navigate('overview')}/>
          <div className="pn-content">{PAGES[page]}</div>
        </div>
        <BottomNav page={page} setPage={navigate}/>
      </div>
      <SupportChat/>
      <InstallBanner/>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function PanelNG() {
  const { user: authUser, logout, refreshUser, updateUser } = useAuth();

  const user = authUser ? {
    name: authUser.full_name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    role: authUser.role || 'user',
    balance: Number(authUser.wallet_balance || 0),
    totalOrders: Number(authUser.total_orders || 0),
    totalSpent: Number(authUser.total_spent || 0),
    referral_code: authUser.referral_code || '',
    initials: (authUser.full_name || authUser.email || 'U')
      .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
    logout: logout || (() => {}),
    refreshUser: refreshUser || (() => {}),
  } : { ...MOCK.user, logout: () => {}, refreshUser: () => {} };

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

  return (
    <UserCtx.Provider value={user}>
      <ThemeProvider><App/></ThemeProvider>
    </UserCtx.Provider>
  );
}
