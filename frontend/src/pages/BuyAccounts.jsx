import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API = '/api/accszone';
const fmt = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Chip display order — matches actual ACCSZONE category structure
const CHIP_ORDER = [
  'Facebook','Instagram','TikTok','Twitter/X','YouTube',
  'WhatsApp','Snapchat','Telegram','Discord',
  'LinkedIn','Reddit','Pinterest','Threads','Bluesky',
  'Gmail','Outlook','Email',
  'Apple ID',
  'Netflix','Spotify','Streaming','Amazon',
  'Gaming','Crypto',
  'VPN','Proxy',
  'Dating',
  'Other',
];

// Map ACCSZONE category.title (lowercase) → chip name
const CATEGORY_CHIP_MAP = {
  'facebook accounts':             'Facebook',
  'instagram accounts':            'Instagram',
  'tiktok':                        'TikTok',
  'twitter/x accounts':            'Twitter/X',
  'youtube accounts & channels':   'YouTube',
  'whatsapp accounts':             'WhatsApp',
  'snapchat accounts':             'Snapchat',
  'telegram accounts':             'Telegram',
  'discord accounts':              'Discord',
  'linkedin accounts':             'LinkedIn',
  'reddit accounts':               'Reddit',
  'pinterest accounts':            'Pinterest',
  'threads':                       'Threads',
  'bluesky':                       'Bluesky',
  'gmail accounts':                'Gmail',
  'google voice accounts':         'Gmail',
  'google ads accounts':           'Gmail',
  'outlook email accounts':        'Outlook',
  'gmx email accounts':            'Email',
  'yahoo mail':                    'Email',
  'zoho mail':                     'Email',
  'aol mail':                      'Email',
  'onet pl':                       'Email',
  'protonmail accounts':           'Email',
  'usa email & phone leads':       'Email',
  'apple':                         'Apple ID',
  'apple id & gift cards':         'Apple ID',
  'netflix accounts & gift cards': 'Netflix',
  'spotify premium':               'Spotify',
  'streaming media':               'Streaming',
  'amazon accounts':               'Amazon',
  'amazon gift cards':             'Amazon',
  'playstation gift cards':        'Gaming',
  'steam gift cards':              'Gaming',
  'google play gift cards':        'Gaming',
  'binance verified account':      'Crypto',
  'cashapp accounts':              'Crypto',
  'vpn premium':                   'VPN',
  'windows vps / rdp server':      'VPN',
  'mobile proxies':                'Proxy',
  'badoo dating accounts':         'Dating',
  'bumble dating accounts':        'Dating',
  'grindr dating accounts':        'Dating',
  'meetme dating accounts':        'Dating',
  'eharmony dating':               'Dating',
  'taimi dating accounts':         'Dating',
  'dating app accounts':           'Dating',
  'craigslist':                    'Other',
  'indeed accounts':               'Other',
  'quora accounts':                'Other',
  'etsy-accounts':                 'Other',
  'trustpilot accounts':           'Other',
  'truth social':                  'Other',
  'walmart':                       'Other',
};

function getCategoryChip(listing) {
  const cat = (listing.category?.title || '').toLowerCase();
  if (cat && CATEGORY_CHIP_MAP[cat]) return CATEGORY_CHIP_MAP[cat];
  // Fallback: keyword scan on title
  const t = (listing.title || listing.name || '').toLowerCase();
  if (t.includes('facebook')) return 'Facebook';
  if (t.includes('instagram')) return 'Instagram';
  if (t.includes('tiktok')) return 'TikTok';
  if (t.includes('twitter') || t.includes(' x ')) return 'Twitter/X';
  if (t.includes('youtube')) return 'YouTube';
  if (t.includes('whatsapp')) return 'WhatsApp';
  if (t.includes('snapchat')) return 'Snapchat';
  if (t.includes('telegram')) return 'Telegram';
  if (t.includes('discord')) return 'Discord';
  if (t.includes('linkedin')) return 'LinkedIn';
  if (t.includes('reddit')) return 'Reddit';
  if (t.includes('pinterest')) return 'Pinterest';
  if (t.includes('threads')) return 'Threads';
  if (t.includes('bluesky')) return 'Bluesky';
  if (t.includes('gmail') || t.includes('google voice')) return 'Gmail';
  if (t.includes('outlook')) return 'Outlook';
  if (t.includes('vpn') || t.includes('nordvpn') || t.includes('expressvpn')) return 'VPN';
  if (t.includes('proxy') || t.includes('proxies')) return 'Proxy';
  if (t.includes('netflix')) return 'Netflix';
  if (t.includes('spotify')) return 'Spotify';
  if (t.includes('amazon')) return 'Amazon';
  if (t.includes('apple id') || t.includes('icloud')) return 'Apple ID';
  if (t.includes('binance') || t.includes('cashapp') || t.includes('crypto')) return 'Crypto';
  if (t.includes('dating') || t.includes('bumble') || t.includes('tinder') || t.includes('grindr')) return 'Dating';
  return 'Other';
}

function stripHtml(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&bull;/g, '•')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseDuration(text = '') {
  if (/lifetime/i.test(text)) return 'Lifetime';
  const m = text.match(/(\d+)\s*(month|months|year|years|week|weeks|day|days)/i);
  if (!m) return null;
  const n = parseInt(m[1]);
  const unit = m[2].toLowerCase().replace(/s$/, '');
  return `${n} ${unit}${n !== 1 ? 's' : ''}`;
}

function extractFeatures(html = '') {
  const text = html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  return text.split('\n')
    .map(l => l.trim().replace(/^[✔✓️✅\s]+/, '').trim())
    .filter(l => l.length > 4 && /^[A-Z]/.test(l) && !l.startsWith('Step') && !l.startsWith('•'))
    .slice(0, 8);
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
function AccIcon({ name, size = 24 }) {
  const s = size;
  const map = {
    Facebook: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1877F2"/><path d="M16 3h-2.5C11.6 3 10 4.6 10 7.5V10H7v4h3v9h4v-9h2.9L17.5 10H14V8c0-1.1.4-2 2-2H16V3z" fill="white"/></svg>,
    Gmail: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#fff" stroke="#E2E0D8"/><path d="M4 8l8 5 8-5" stroke="#EA4335" strokeWidth="1.5" fill="none"/><rect x="4" y="7" width="16" height="10" rx="1" stroke="#EA4335" strokeWidth="1.5" fill="none"/></svg>,
    Instagram: <svg width={s} height={s} viewBox="0 0 24 24"><defs><radialGradient id="acc-ig" cx="30%" cy="110%" r="150%"><stop offset="0%" stopColor="#FCAF45"/><stop offset="50%" stopColor="#FD1D1D"/><stop offset="100%" stopColor="#833AB4"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#acc-ig)"/><rect x="6.5" y="6.5" width="11" height="11" rx="3" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="16.5" cy="7.5" r="0.75" fill="white"/></svg>,
    TikTok: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#010101"/><path d="M17 8.4a4.3 4.3 0 01-2.6-.9v5.8a4.2 4.2 0 11-4.2-4.2h.4v2.1h-.4a2.1 2.1 0 102.1 2.1V3h2.1a4.3 4.3 0 004.3 4.2v2.1A4.3 4.3 0 0117 8.4z" fill="white"/></svg>,
    'Twitter/X': <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><path d="M17.5 5h2.1l-4.6 5.3 5.4 7.2H17l-3.3-4.4-3.8 4.4H7.8l4.9-5.6L7 5h4.6l3 4zm-.7 11.2h1.2L7.3 6.3H6z" fill="white"/></svg>,
    LinkedIn: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0A66C2"/><path d="M7 9h2v8H7zm1-1.5a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zM11 9h2v1.1c.3-.6 1-1.1 2.2-1.1C17 9 18 10.1 18 12v5h-2v-4.5c0-1-.6-1.5-1.4-1.5-.9 0-1.6.6-1.6 1.7V17H11V9z" fill="white"/></svg>,
    Telegram: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#2AABEE"/><path d="M19.8 5.5L4.3 11.7c-1 .4-1 1-.2 1.2l3.8 1.2 8.8-5.6c.4-.3.8-.1.5.2L9.6 14.5v2.3l1.8-1.8 3.9 2.9c.7.4 1.2.2 1.4-.7l2.5-11.7c.3-1-.4-1.5-1.4-1z" fill="white"/></svg>,
    Discord: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#5865F2"/><path d="M17.5 6.5c-1.2-.6-2.5-.9-3.9-1l-.2.3c1.3.3 2.5.8 3.6 1.6-1.5-.8-3.2-1.2-4.9-1.2s-3.5.4-4.9 1.2c1.1-.8 2.4-1.3 3.7-1.6L10.7 5.5c-1.4.1-2.8.5-4 1.1C5.6 9.1 5 12 5 14.7c1.3 1.5 3.3 2.3 5.4 2.3l.7-1C10.2 15.7 9.4 15 9 14.2c.3.2.7.4 1 .5a8.7 8.7 0 003.8.9c1.3 0 2.7-.3 3.9-.9.3-.1.7-.3 1-.5-.4.8-1.3 1.5-2.2 1.8l.7 1c2.1 0 4.1-.8 5.4-2.3C22 12 21.4 9.1 20.3 7c-.9-.4-2-.8-2.8-.5zM9.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="white"/></svg>,
    Reddit: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF4500"/><circle cx="12" cy="13" r="5" fill="white"/><circle cx="9.5" cy="13.5" r="1" fill="#FF4500"/><circle cx="14.5" cy="13.5" r="1" fill="#FF4500"/><path d="M9.5 15.5s.5 1 2.5 1 2.5-1 2.5-1" stroke="#FF4500" strokeWidth="1" fill="none" strokeLinecap="round"/><circle cx="17" cy="9" r="2" fill="white"/><circle cx="12" cy="7" r="2.5" fill="white"/><path d="M14.3 7.2l2.2-1" stroke="white" strokeWidth="1" fill="none"/></svg>,
    Snapchat: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FFFC00"/><path d="M12 4.5c-2 0-3.5 1.5-3.5 3.5v2c-.3.1-.7.2-1 .3-.1.5.1.8.5.9.5.1.7.5.6 1-.1.4-.5.8-1.1 1.2.2.5.6.6 1.1.6.2 0 .5 0 .8-.1.5.7 1.3 1.1 2.6 1.1s2.1-.4 2.6-1.1c.3.1.6.1.8.1.5 0 .9-.1 1.1-.6-.6-.4-1-.8-1.1-1.2-.1-.5.1-.9.6-1 .4-.1.6-.4.5-.9-.3-.1-.7-.2-1-.3V8c0-2-1.5-3.5-3.5-3.5z" fill="#1A1917"/></svg>,
    'Apple ID': <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1A1917"/><path d="M15.5 6.5c-.8 1-2.1 1.7-3.3 1.6-.1-1.2.5-2.5 1.2-3.3.8-.9 2.1-1.6 3.2-1.6.1 1.3-.4 2.5-1.1 3.3zM16.8 8.2c-1.8-.1-3.3 1-4.2 1-.9 0-2.2-.9-3.7-.9-1.9 0-3.6 1.1-4.6 2.8-2 3.4-.5 8.4 1.4 11.2.9 1.4 2 2.9 3.5 2.8 1.4-.1 1.9-.9 3.5-.9s2.2.9 3.5.9 2.5-1.4 3.5-2.8c1.1-1.6 1.5-3.1 1.5-3.2-.1 0-2.9-1.1-2.9-4.3 0-2.7 2.2-4 2.3-4.1-.9-1.3-2.4-1.5-2.8-1.5z" fill="white"/></svg>,
    Tinder: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF6B6B"/><path d="M12 19.5c-3 0-5.5-2.5-5.5-5.5 0-2 1.5-4 3-5.5-.5 2.5 1.5 3.5 1.5 3.5s-.5-3.5 3-6c0 0-1 4.5 3 6.5 1 .5 1.5 1.5 1.5 2.5 0 2.5-2 4.5-4.5 4.5z" fill="white"/></svg>,
    YouTube: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF0000"/><path d="M20 12s0-2.5-.3-3.7a2 2 0 00-1.4-1.4C17.2 6.6 12 6.6 12 6.6s-5.2 0-6.3.3a2 2 0 00-1.4 1.4C4 9.5 4 12 4 12s0 2.5.3 3.7a2 2 0 001.4 1.4C6.8 17.4 12 17.4 12 17.4s5.2 0 6.3-.3a2 2 0 001.4-1.4C20 14.5 20 12 20 12z" fill="white" fillOpacity=".9"/><polygon points="10,9.5 15.5,12 10,14.5" fill="#FF0000"/></svg>,
    WhatsApp: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#25D366"/><path d="M12 4.5C7.9 4.5 4.5 7.9 4.5 12c0 1.5.4 3 1.2 4.2L4.5 19.5l3.3-1.2C9 19 10.5 19.5 12 19.5c4.1 0 7.5-3.4 7.5-7.5S16.1 4.5 12 4.5zm3.9 10.2c-.2.5-.9 1-1.4 1.1-.4.1-.9.1-2.7-.6-2.3-.9-3.7-3.2-3.8-3.4-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8.2-.2.5-.3.7-.3h.5c.2 0 .4.1.6.5l.8 1.9c.1.2.1.4 0 .6l-.3.5c-.1.1-.2.3-.1.5.4.7.9 1.3 1.5 1.7.7.5 1.3.7 1.6.8.2.1.4 0 .5-.1l.5-.6c.1-.2.3-.3.6-.2l1.8.8c.2.1.4.2.5.4.1.5-.1 1.3-.4 1.9z" fill="white"/></svg>,
    Netflix: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#141414"/><path d="M7 4h3l2 9 2-9h3l-3 8 3 8h-3l-2-9-2 9H7l3-8z" fill="#E50914"/></svg>,
    Spotify: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#1DB954"/><path d="M16.7 15.1c-.2-.3-.6-.4-.9-.2-2.5 1.5-5.7 1.9-9.4 1-.3-.1-.7.1-.8.5-.1.3.1.7.5.8 4.1 1 7.7.5 10.5-1.1.3-.2.3-.6.1-1zm1.1-2.8c-.3-.4-.8-.5-1.2-.3-3 1.8-7.5 2.3-11 1.3-.4-.1-.9.1-1 .5-.1.4.1.9.5 1 4 1.1 9 .5 12.4-1.5.4-.2.5-.7.3-1zm.1-2.9c-3.5-2.1-9.4-2.3-12.7-1.3-.5.2-.8.7-.6 1.2.2.5.7.8 1.2.6 2.9-.9 8.1-.7 11.2 1.1.4.3.9.1 1.2-.3.2-.5.1-1-.3-1.3z" fill="white"/></svg>,
    Amazon: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF9900"/><text x="12" y="16" fontSize="11" fontWeight="800" textAnchor="middle" fill="#1A1917" fontFamily="serif">amazon</text></svg>,
    PayPal: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#003087"/><path d="M9 5h4c2 0 3.5 1 3.5 3s-1.5 4-4 4h-2l-1 5H7l2-12zm2 5.5h1.5c1.2 0 2-.6 2-1.5s-.8-1.5-2-1.5h-2l.5 3z" fill="white"/><path d="M13 7h4c2 0 3.5 1 3.5 3s-1.5 4-4 4h-2l-1 5h-2.5l2-12z" fill="#009CDE" opacity=".8"/></svg>,
    Binance: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1A1917"/><path d="M12 4l-2 2-3-3L5 5l3 3-3 3 2 2 3-3 3 3 2-2-3-3 3-3-2-2zm4 8l-2 2 2 2 2-2-2-2zM12 17l-3 3 2 2 3-3 3 3 2-2-3-3-2 2-2-2z" fill="#F3BA2F"/></svg>,
    Coinbase: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#0052FF"/><circle cx="12" cy="12" r="6" fill="white"/><circle cx="12" cy="12" r="3.5" fill="#0052FF"/></svg>,
    Crypto: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1A1917"/><path d="M12 3L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7L12 3zm-1 12.5l-3-3 1.4-1.4 1.6 1.6 4.2-4.2 1.4 1.4L11 15.5z" fill="#F3BA2F"/></svg>,
    Steam: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1B2838"/><path d="M12 3a9 9 0 00-9 8.4l4.8 2a2.5 2.5 0 011.3-.4h.3l2.2-3.1A3.5 3.5 0 0115 6.5a3.5 3.5 0 010 7 3.5 3.5 0 01-3.3-2.4l-3.1 2.2c0 .1 0 .2-.1.3a2.5 2.5 0 01-5 .1L3.1 12A9 9 0 1012 3zm-4.5 11.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#C5C3C0"/></svg>,
    Gaming: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#7C3AED"/><path d="M6 10h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 012-2zm3 1.5v1h-1v1h1v1h1v-1h1v-1h-1v-1H9zm5.5 1.5a.75.75 0 110 1.5.75.75 0 010-1.5zm1.5-1.5a.75.75 0 110 1.5.75.75 0 010-1.5z" fill="white"/></svg>,
    VPN: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0EA5E9"/><path d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 2c.8 0 1.8.8 2.6 2.3H9.4C10.2 5.8 11.2 5 12 5zm-3.3 2.3H6.4a7 7 0 012.7-2 8.4 8.4 0 00-1.4 2zm5.3 0H9.9a10.4 10.4 0 012.1-3.2 10.4 10.4 0 012.1 3.2h-1zM17.6 7.3h-2.3a8.4 8.4 0 00-1.4-2 7 7 0 012.7 2zm-12 2h2.5a14 14 0 00-.1 1.3v.8H5.1a7 7 0 01.5-2.1zm3.5 0h1.8v2.1H8.1v-.8c0-.4 0-.9.1-1.3zm2.8 0h1.8c.1.4.1.9.1 1.3v.8h-1.9v-2.1zm2.8 0h2.5a7 7 0 01.5 2.1h-3v-.8c0-.4 0-.9-.1-1.3zM5.1 13.5h2.9v.8c0 .4 0 .9.1 1.3H5.6a7 7 0 01-.5-2.1zm3.9 0h1.9v2.1H9.1c-.1-.4-.1-.9-.1-1.3v-.8zm2.9 0H13v.8c0 .4 0 .9-.1 1.3h-1.9v-2.1zm3 0h2.9a7 7 0 01-.5 2.1h-2.5c.1-.4.1-.9.1-1.3v-.8zm-8 3.2h2.3a8.4 8.4 0 001.4 2 7 7 0 01-2.7-2zm3.3 2.3h1.5a10.4 10.4 0 01-2.1 3.2 10.4 10.4 0 01-2.1-3.2h2.7zm2.5 0h2.3a7 7 0 01-2.7 2 8.4 8.4 0 001.4-2z" fill="white"/></svg>,
    Bumble: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#FFC629"/><path d="M12 5a7 7 0 100 14A7 7 0 0012 5zm-1 9v-2H9v-2h2V8h2v2h2v2h-2v2h-2z" fill="#1A1917"/></svg>,
    OnlyFans: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#00AFF0"/><path d="M12 6a6 6 0 100 12A6 6 0 0012 6zm0 2a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4z" fill="white"/></svg>,
    Pinterest: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#E60023"/><path d="M12 3C7 3 3 7 3 12c0 3.8 2.3 7.1 5.6 8.5-.1-.7-.1-1.7.1-2.5l1-4.2s-.3-.5-.3-1.3c0-1.2.7-2.1 1.6-2.1.8 0 1.1.6 1.1 1.3 0 .8-.5 2-.8 3.1-.2.9.4 1.6 1.3 1.6 1.6 0 2.7-2 2.7-4.5 0-1.8-1.2-3.2-3.3-3.2-2.4 0-3.9 1.8-3.9 3.8 0 .7.2 1.2.5 1.6.1.2.1.3.1.5l-.2.9c-.1.2-.2.3-.4.2-1.4-.5-2-2-2-3.6 0-2.7 2.3-5.9 6.8-5.9 3.6 0 6 2.6 6 5.4 0 3.7-2 6.5-5 6.5-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.7 1.7-1 2.3.8.2 1.6.3 2.4.3 5 0 9-4 9-9s-4-9-9-9z" fill="white"/></svg>,
    Twitch: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#9146FF"/><path d="M5 3L3 7v13h5v3h3l3-3h4l5-5V3H5zm15 11l-3 3h-4l-3 3v-3H6V5h14v9z" fill="white"/><path d="M10 8h2v5h-2zm5 0h2v5h-2z" fill="#9146FF"/></svg>,
    Threads: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><path d="M16 9.5c-.3-.1-.7-.2-1-.3C14.7 7.4 13.4 6.5 12 6.5c-2.2 0-4 1.8-4 4 0 .8.3 1.6.7 2.2-.4.4-.7 1-.7 1.8 0 1.7 1.3 3 3 3 1.1 0 2.1-.6 2.6-1.5.3.1.5.1.8.1 1.4 0 2.6-1.1 2.6-2.5 0-.8-.4-1.5-.9-2 .5-.5.9-1.3.9-2.1z" fill="white"/></svg>,
    Uber: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><text x="5" y="16" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">Uber</text></svg>,
    Airbnb: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#FF5A5F"/><path d="M12 5c-1.5 0-2.5 1.2-2.5 2.5 0 1.7 2.5 5.5 2.5 5.5s2.5-3.8 2.5-5.5C14.5 6.2 13.5 5 12 5zm0 9.5c-2 0-6 1.8-6 3.5 0 .8.7 1.5 2 2h8c1.3-.5 2-1.2 2-2 0-1.7-4-3.5-6-3.5z" fill="white"/></svg>,
    Bluesky: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0085FF"/><path d="M12 8.5C10.5 6.5 7 5 5 6.5c-2.5 1.8-.5 5.5 2 6.5-1 .5-2 1.5-2 2.5 0 1.5 1.5 2.5 3 1.5 1-.5 2-1.5 4-4.5 2 3 3 4 4 4.5 1.5 1 3 0 3-1.5 0-1-1-2-2-2.5 2.5-1 4.5-4.7 2-6.5-2-1.5-5.5 0-7 2z" fill="white"/></svg>,
    Outlook: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0072C6"/><rect x="4" y="7" width="10" height="10" rx="2" fill="#fff"/><path d="M14 9l6-3v12l-6-3V9z" fill="#fff" opacity=".85"/><circle cx="9" cy="12" r="2.5" fill="#0072C6"/></svg>,
    Email: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#6B7280"/><rect x="4" y="7" width="16" height="11" rx="2" fill="none" stroke="white" strokeWidth="1.5"/><path d="M4 9l8 5 8-5" stroke="white" strokeWidth="1.5" fill="none"/></svg>,
    Dating: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#EC4899"/><path d="M12 18s-7-4.5-7-8.5C5 7 6.8 5.5 9 6c1.2.3 2.2 1 3 2 .8-1 1.8-1.7 3-2 2.2-.5 4 1 4 3.5 0 4-7 8.5-7 8.5z" fill="white"/></svg>,
    Streaming: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#7C3AED"/><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5"/><polygon points="10,9.5 16,12 10,14.5" fill="white"/></svg>,
    Proxy: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#6366F1"/><circle cx="6" cy="12" r="2" fill="white"/><circle cx="18" cy="7" r="2" fill="white"/><circle cx="18" cy="17" r="2" fill="white"/><path d="M8 12h4m0 0l-1-5h3m-2 5l-1 5h3" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>,
    Other: <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#6B6860"/><circle cx="8" cy="12" r="1.5" fill="white"/><circle cx="12" cy="12" r="1.5" fill="white"/><circle cx="16" cy="12" r="1.5" fill="white"/></svg>,
  };
  return map[name] || map['Other'];
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-raised)', animation: 'pn-pulse 1.4s ease-in-out infinite' }} />
        <div style={{ width: 44, height: 20, borderRadius: 100, background: 'var(--bg-raised)', animation: 'pn-pulse 1.4s ease-in-out infinite' }} />
      </div>
      <div style={{ width: '80%', height: 14, borderRadius: 6, background: 'var(--bg-raised)', marginBottom: 8, animation: 'pn-pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '60%', height: 12, borderRadius: 6, background: 'var(--bg-raised)', marginBottom: 16, animation: 'pn-pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '100%', height: 6, borderRadius: 100, background: 'var(--bg-raised)', marginBottom: 16, animation: 'pn-pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '50%', height: 18, borderRadius: 6, background: 'var(--bg-raised)', marginBottom: 12, animation: 'pn-pulse 1.4s ease-in-out infinite' }} />
      <div style={{ width: '100%', height: 40, borderRadius: 10, background: 'var(--bg-raised)', animation: 'pn-pulse 1.4s ease-in-out infinite' }} />
    </div>
  );
}

// ─── STOCK BAR ────────────────────────────────────────────────────────────────
function StockBar({ qty, max = 100 }) {
  const pct = Math.min(100, (qty / max) * 100);
  const color = qty <= 3 ? 'var(--danger)' : qty <= 10 ? '#F59E0B' : 'var(--success)';
  const label = qty <= 3 ? `Only ${qty} left!` : qty <= 10 ? `Only ${qty} left` : `${qty} in stock`;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ height: 6, borderRadius: 100, background: 'var(--bg-raised)', marginBottom: 5, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: color, transition: 'width 400ms ease' }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ─── STOCK BADGE ──────────────────────────────────────────────────────────────
function StockBadge({ qty }) {
  if (qty <= 3) return <span style={{ background: 'rgba(248,113,113,.12)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,.25)', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>LOW STOCK</span>;
  if (qty <= 15) return <span style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,.25)', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>HOT</span>;
  return <span style={{ background: 'rgba(20,184,166,.12)', color: '#14B8A6', border: '1px solid rgba(20,184,166,.25)', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>NEW</span>;
}

// ─── FEATURE PILLS ────────────────────────────────────────────────────────────
function FeaturePills() {
  const pills = [
    { icon: 'ti-bolt', label: 'Instant' },
    { icon: 'ti-shield-check', label: 'Verified' },
    { icon: 'ti-refresh', label: 'Guaranteed' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
      {pills.map(p => (
        <span key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', borderRadius: 100, fontSize: 10, fontWeight: 500, background: 'var(--tag-bg)', color: 'var(--tag-text)' }}>
          <i className={`ti ${p.icon}`} style={{ fontSize: 11 }} />{p.label}
        </span>
      ))}
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ listing, onClick, exchangeRate = 1600 }) {
  const platform = listing._platform || 'Other';
  const qty = Number(listing.quantity || listing.stock || listing.available_stock || 50);
  const priceUSD = Number(listing.price || listing.unit_price || 0);
  const priceNGN = listing._sell_price_ngn != null ? listing._sell_price_ngn : priceUSD * exchangeRate;
  const title = listing.title || listing.name || 'Account';
  const desc = listing.short_description
    || (listing.description ? stripHtml(listing.description).slice(0, 80) : '')
    || '';

  return (
    <div
      onClick={() => onClick(listing)}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, cursor: 'pointer', transition: 'box-shadow 150ms ease, border-color 150ms ease', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <AccIcon name={platform} size={32} />
        <StockBadge qty={qty} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5, flex: 1 }}>{desc.length > 70 ? desc.slice(0, 70) + '…' : desc}</div>}
      <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: 12 }} />
      <FeaturePills />
      <StockBar qty={qty} max={200} />
      <div style={{ fontFamily: "'Geist Mono','Courier New',monospace", fontSize: 16, fontWeight: 500, color: 'var(--accent)', marginBottom: 12 }}>
        {fmt(priceNGN)} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>/ account</span>
      </div>
      <button
        style={{ width: '100%', height: 44, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        onClick={e => { e.stopPropagation(); onClick(listing); }}
      >
        View & Buy <i className="ti ti-arrow-right" />
      </button>
    </div>
  );
}

// ─── ACCOUNT CREDENTIAL ROW ───────────────────────────────────────────────────
function CredRow({ label, value }) {
  const [show, setShow] = useState(false);
  const isSecret = label.toLowerCase().includes('pass') || label.toLowerCase().includes('token');
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 80, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: "'Geist Mono','Courier New',monospace", fontSize: 13, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {isSecret && !show ? '••••••••' : value}
      </span>
      {isSecret && (
        <button onClick={() => setShow(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 2 }}>
          <i className={`ti ${show ? 'ti-eye-off' : 'ti-eye'}`} />
        </button>
      )}
      <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text-muted)', fontSize: 14, padding: 2 }}>
        <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />
      </button>
    </div>
  );
}

// ─── SPEC ROW ─────────────────────────────────────────────────────────────────
function SpecRow({ label, value, even }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', background: even ? 'var(--bg-raised)' : 'var(--bg-surface)', borderBottom: '0.5px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

// ─── USE CASE ROW ─────────────────────────────────────────────────────────────
function UseCaseRow({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-raised)', borderRadius: 10, marginBottom: 8 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 18, color: 'var(--accent)' }} />
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{text}</span>
    </div>
  );
}

// ─── DETAIL SHEET ─────────────────────────────────────────────────────────────
function DetailSheet({ listing, detail, detailLoading, onClose, balance, onBuy, exchangeRate = 1600 }) {
  const [qty, setQty] = useState(1);
  const platform = listing._platform || 'Other';
  const priceUSD = Number(listing.price || listing.unit_price || 0);
  const priceNGN = listing._sell_price_ngn != null ? listing._sell_price_ngn : priceUSD * exchangeRate;
  const stock = Number(listing.quantity || listing.stock || listing.available_stock || 50);
  const title = listing.title || listing.name || 'Account';
  const total = priceNGN * qty;
  const insufficient = balance < total;

  const rawDesc = detail?.description || listing.description || '';
  const cleanDesc = rawDesc ? stripHtml(rawDesc) : '';
  const features = rawDesc ? extractFeatures(rawDesc) : [];
  const duration = parseDuration(listing.title || listing.name || '') || parseDuration(cleanDesc);
  const catLabel = detail?.category?.title || listing.category?.title || '';

  const isMobile = window.innerWidth <= 768;

  const sheetStyle = isMobile
    ? { position: 'fixed', bottom: 0, left: 0, right: 0, height: '90vh', background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', zIndex: 300, display: 'flex', flexDirection: 'column', overflowY: 'auto' }
    : { position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20, maxWidth: 520, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' };

  const overlayStyle = isMobile
    ? { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 299 }
    : { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 299, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div style={overlayStyle} onClick={isMobile ? onClose : undefined}>
      <div style={sheetStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <AccIcon name={platform} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{platform} · Account</div>
              <div style={{ fontFamily: "'Geist Mono','Courier New',monospace", fontSize: 20, fontWeight: 500, color: 'var(--accent)' }}>{fmt(priceNGN)} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ account</span></div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            <i className="ti ti-package" style={{ marginRight: 5 }} />{stock} available
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 120px' }}>
          {detailLoading ? (
            <div style={{ padding: 24 }}>
              {[80, 60, 100, 70, 90].map((w, i) => (
                <div key={i} style={{ height: 12, borderRadius: 6, background: 'var(--bg-raised)', marginBottom: 12, width: `${w}%`, animation: 'pn-pulse 1.4s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <>
              {/* About This Product — real description from ACCSZONE */}
              {cleanDesc ? (
                <div style={{ padding: '18px 20px 0' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>About This Product</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {cleanDesc.length > 600 ? cleanDesc.slice(0, 600) + '…' : cleanDesc}
                  </div>
                </div>
              ) : null}

              {/* Duration badge */}
              {duration && (
                <div style={{ padding: '14px 20px 0' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(20,184,166,.1)', border: '1px solid rgba(20,184,166,.3)', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#14B8A6' }}>
                    <i className="ti ti-clock" style={{ fontSize: 14 }} />Duration: {duration}
                  </div>
                </div>
              )}

              {/* What's Included — from API features, or fallback */}
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>What's Included</div>
                {(features.length > 0 ? features : [
                  `1 × ${platform} account per unit`,
                  'Full login credentials',
                  'Pre-login replacement guarantee',
                ]).map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 9, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <i className="ti ti-circle-check" style={{ color: 'var(--success)', fontSize: 15, flexShrink: 0, marginTop: 1 }} />{item}
                  </div>
                ))}
              </div>

              {/* Account Specs */}
              <div style={{ padding: '18px 0 0' }}>
                <div style={{ padding: '0 20px', fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Account Details</div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', margin: '0 20px' }}>
                  {[
                    ['Platform', platform],
                    catLabel && catLabel !== platform ? ['Category', catLabel] : null,
                    ['Account Type', 'Personal'],
                    duration ? ['Duration / Plan', duration] : null,
                    ['Region', 'USA / UK / Global'],
                    ['Verified', 'Email verified'],
                    ['2FA Status', 'Off'],
                    ['Email Access', 'Included'],
                  ].filter(Boolean).map(([label, value], i) => (
                    <SpecRow key={label} label={label} value={value} even={i % 2 === 0} />
                  ))}
                </div>
              </div>

              {/* Delivery Format */}
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Delivery Format</div>
                <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontFamily: "'Geist Mono','Courier New',monospace", fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {platform === 'Gmail' ? 'email:password:recovery_email' :
                   platform === 'Facebook' ? 'email:password' :
                   platform === 'Instagram' ? 'username:password:email:email_pass' :
                   platform === 'TikTok' ? 'email:password' :
                   platform === 'Discord' ? 'email:password:token' :
                   platform === 'Telegram' ? 'phone:session_string' :
                   platform === 'Spotify' || platform === 'Netflix' || platform === 'Amazon' ? 'email:password (subscription active)' :
                   'login:password'}
                </div>
              </div>

              {/* Guarantee */}
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <i className="ti ti-shield-check" style={{ fontSize: 22, color: 'var(--success)' }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Pre-Login Replacement Guarantee</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>If an account is invalid or suspended before you log in, we replace it instantly or refund you in full.</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No guarantee after first login.</p>
                </div>
              </div>

              {/* Before You Buy */}
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <i className="ti ti-alert-triangle" style={{ color: '#F59E0B', fontSize: 18 }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Before You Buy</span>
                  </div>
                  {['Do not change the password immediately after login', 'Use a matching proxy or VPN for the account\'s country', 'Do not enable 2FA right away — warm up first', 'Accounts are for single use — do not share'].map(note => (
                    <div key={note} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <i className="ti ti-point-filled" style={{ marginTop: 4, flexShrink: 0 }} />{note}
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ padding: '18px 20px 20px' }}>
                <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <i className="ti ti-info-circle" style={{ fontSize: 14, color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Disclaimer</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                    PanelNG acts solely as a reseller of third-party digital accounts. We are not responsible for how purchased accounts are used after delivery. By completing this purchase you agree to use accounts only for lawful purposes. Any misuse, violation of platform terms, or illegal activity is the sole responsibility of the buyer. Accounts suspended due to policy violations after delivery are not eligible for replacement or refund.
                  </p>
                </div>
              </div>

            </>
          )}
        </div>

        {/* Sticky buy bar */}
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '14px 20px', flexShrink: 0 }}>
          {insufficient && (
            <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>
              You need {fmt(total - balance)} more. Balance: {fmt(balance)}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', height: 48, flexShrink: 0 }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: '100%', background: 'var(--bg-raised)', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontFamily: "'Geist Mono','Courier New',monospace", fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', padding: '0 14px', minWidth: 40, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(stock, q + 1))} style={{ width: 40, height: '100%', background: 'var(--bg-raised)', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Total</div>
              <div style={{ fontFamily: "'Geist Mono','Courier New',monospace", fontSize: 18, fontWeight: 500, color: 'var(--accent)' }}>{fmt(total)}</div>
            </div>
            <button
              onClick={() => onBuy(listing, qty)}
              style={{ height: 48, padding: '0 20px', background: insufficient ? 'var(--bg-raised)' : 'var(--accent)', color: insufficient ? 'var(--accent)' : 'var(--accent-text)', border: insufficient ? '1px solid var(--accent)' : 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", whiteSpace: 'nowrap' }}
            >
              {insufficient ? 'Add Funds to Buy' : 'Buy Now →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PURCHASE MODAL ───────────────────────────────────────────────────────────
function PurchaseModal({ listing, qty, balance, onClose, onSuccess, onAddFunds, token, exchangeRate = 1600 }) {
  const [step, setStep] = useState('confirm'); // confirm | processing | success | error
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const platform = listing._platform || 'Other';
  const priceUSD = Number(listing.price || listing.unit_price || 0);
  const priceNGN = listing._sell_price_ngn != null ? listing._sell_price_ngn : priceUSD * exchangeRate;
  const total = priceNGN * qty;
  const afterBalance = balance - total;
  const insufficient = balance < total;
  const title = listing.title || listing.name || 'Account';

  const handleConfirm = async () => {
    setStep('processing');
    try {
      const { data } = await axios.post(`${API}/order`, {
        ad_id: listing.id || listing.ad_id,
        quantity: qty,
        listing_slug: listing.slug,
        unit_price: priceUSD, // backend re-verifies and applies any custom override
        product_name: title,
        platform,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(data);
      setStep('success');
      onSuccess && onSuccess(data);
    } catch (err) {
      setErrMsg(err.response?.data?.error || 'Something went wrong. Your wallet was not charged.');
      setStep('error');
    }
  };

  const copyAll = () => {
    const accs = result?.accounts || [];
    const text = Array.isArray(accs)
      ? accs.map(a => Object.values(a).join(':') ).join('\n')
      : JSON.stringify(accs, null, 2);
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto' }}>

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <AccIcon name={platform} size={36} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confirm your purchase</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              {[
                ['Price per account', fmt(priceNGN)],
                ['Quantity', String(qty)],
                ['Your balance', fmt(balance)],
                ['After purchase', fmt(afterBalance)],
              ].map(([l, v], i) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 3 ? '0.5px solid var(--border)' : 'none', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                  <span style={{ fontFamily: "'Geist Mono','Courier New',monospace", fontWeight: 500, color: i === 3 ? (afterBalance < 0 ? 'var(--danger)' : 'var(--text-primary)') : 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: 15 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total</span>
                <span style={{ fontFamily: "'Geist Mono','Courier New',monospace", fontWeight: 600, color: 'var(--accent)', fontSize: 17 }}>{fmt(total)}</span>
              </div>
            </div>
            {insufficient ? (
              <>
                <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-alert-circle" />Insufficient balance. Add {fmt(total - balance)} more.
                </div>
                <button onClick={onAddFunds} style={{ width: '100%', height: 44, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>
                  Add Funds →
                </button>
              </>
            ) : (
              <button onClick={handleConfirm} style={{ width: '100%', height: 44, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>
                Confirm Purchase →
              </button>
            )}
            <button onClick={onClose} style={{ width: '100%', height: 40, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Cancel</button>
          </div>
        )}

        {/* PROCESSING */}
        {step === 'processing' && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ti ti-loader-2" style={{ fontSize: 44, color: 'var(--accent)', display: 'block', marginBottom: 16, animation: 'pn-spin 1s linear infinite' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Placing your order…</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Processing your order — please wait.</div>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div style={{ padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 48, color: 'var(--success)', display: 'block', marginBottom: 12 }} />
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Order Placed Successfully!</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{qty} × {title}</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#F59E0B', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-alert-triangle" />Save these now — they will not be shown again.
            </div>
            {/* Delivered accounts */}
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: '4px 16px', marginBottom: 16, maxHeight: 240, overflowY: 'auto' }}>
              {(result?.accounts || []).length > 0
                ? (result.accounts.map((acc, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: i < result.accounts.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                      {Object.entries(acc).map(([k, v]) => <CredRow key={k} label={k} value={String(v)} />)}
                    </div>
                  )))
                : <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Account data delivered. Check your order history for details.</div>
              }
            </div>
            <button onClick={copyAll} style={{ width: '100%', height: 44, background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="ti ti-copy" />Copy All Accounts
            </button>
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                <i className="ti ti-info-circle" style={{ marginRight: 5 }} />
                PanelNG is not liable for how these accounts are used. By receiving this purchase you agree to use them only for lawful purposes. Misuse, violation of platform terms, or any illegal activity is solely your responsibility.
              </p>
            </div>
            <button onClick={onClose} style={{ width: '100%', height: 40, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Done</button>
          </div>
        )}

        {/* ERROR */}
        {step === 'error' && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 48, color: 'var(--danger)', display: 'block', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{errMsg}</div>
            <button onClick={() => setStep('confirm')} style={{ width: '100%', height: 44, background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>Try Again</button>
            <button onClick={onClose} style={{ width: '100%', height: 40, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EXTRA CSS ────────────────────────────────────────────────────────────────
const EXTRA_CSS = `
@keyframes pn-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes pn-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.acc-root { width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; }
.acc-chips { display:flex; gap:8px; overflow-x:auto; overflow-y:visible; padding-bottom:4px; margin-bottom:20px; scrollbar-width:none; -webkit-overflow-scrolling:touch; flex-wrap:nowrap; }
.acc-chips::-webkit-scrollbar { display:none; }
.acc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr)); gap:14px; width:100%; box-sizing:border-box; }
@media(max-width:600px){ .acc-grid{ gap:10px; } }
`;

// ─── BUY ACCOUNTS PAGE ────────────────────────────────────────────────────────
export default function BuyAccounts({ balance = 0, token = '', onNavigate, onPurchaseComplete }) {
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('All');
  const [detailListing, setDetailListing] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [purchaseListing, setPurchaseListing] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [exchangeRate, setExchangeRate] = useState(1600);

  // Inject extra CSS once
  useEffect(() => {
    const el = document.getElementById('acc-extra-css');
    if (!el) {
      const s = document.createElement('style');
      s.id = 'acc-extra-css';
      s.textContent = EXTRA_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Load exchange rate
  useEffect(() => {
    axios.get('/api/settings/exchange-rate')
      .then(({ data }) => { if (data?.value) setExchangeRate(Number(data.value)); })
      .catch(() => {}); // keep default 1600
  }, []);

  // Load listings
  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`${API}/listings`)
      .then(({ data }) => {
        const raw = Array.isArray(data) ? data : (data.data || data.listings || []);
        const tagged = raw.map(l => ({ ...l, _platform: l._platform || getCategoryChip(l) }));
        setListings(tagged);
      })
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  // Chips: unique platforms present in actual listings, ordered by CHIP_ORDER with Other always last
  const availablePlatforms = ['All', ...[...new Set(listings.map(l => l._platform).filter(Boolean))]
    .sort((a, b) => {
      const ai = CHIP_ORDER.indexOf(a), bi = CHIP_ORDER.indexOf(b);
      const an = ai === -1 ? CHIP_ORDER.length - 1 : ai;
      const bn = bi === -1 ? CHIP_ORDER.length - 1 : bi;
      return an - bn;
    })];

  const filtered = [...(platform === 'All' ? listings : listings.filter(l => l._platform === platform))]
    .sort((a, b) => {
      if (platform === 'All') {
        const ai = CHIP_ORDER.indexOf(a._platform || 'Other');
        const bi = CHIP_ORDER.indexOf(b._platform || 'Other');
        const an = ai === -1 ? CHIP_ORDER.length : ai;
        const bn = bi === -1 ? CHIP_ORDER.length : bi;
        if (an !== bn) return an - bn;
      }
      return Number(a.price || a.unit_price || 0) - Number(b.price || b.unit_price || 0);
    });

  const openDetail = useCallback((listing) => {
    setDetailListing(listing);
    setDetailData(null);
    if (listing.slug) {
      setDetailLoading(true);
      axios.get(`${API}/listings/${listing.slug}`)
        .then(({ data }) => setDetailData(data))
        .catch(() => {})
        .finally(() => setDetailLoading(false));
    }
  }, []);

  const openPurchase = (listing, qty) => {
    setDetailListing(null);
    setPurchaseListing(listing);
    setPurchaseQty(qty);
  };

  return (
    <div className="acc-root">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>Buy Accounts</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Instant delivery. Pre-verified. Ready to use.</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: '6px 12px' }}>
            <i className="ti ti-wallet" style={{ color: 'var(--accent)', fontSize: 14 }} />
            <div>
              <div style={{ fontFamily: 'Geist Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent)', lineHeight: 1 }}>Balance</div>
              <div style={{ fontFamily: "'Geist Mono','Courier New',monospace", fontSize: 14, color: 'var(--accent)' }}>{fmt(balance)}</div>
            </div>
          </div>
        </div>
      </div>


      {/* Platform chips — derived from real listings */}
      {availablePlatforms.length > 1 && (
        <div className="acc-chips">
          {availablePlatforms.map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 34, padding: '0 14px', borderRadius: 100,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 150ms ease',
                background: platform === p ? 'var(--chip-active-bg)' : 'var(--bg-raised)',
                color: platform === p ? 'var(--chip-active-text)' : 'var(--text-secondary)',
                border: platform === p ? '1px solid var(--chip-active-bg)' : '1px solid var(--border)',
                whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans',sans-serif",
                flexShrink: 0,
              }}
            >
              {p !== 'All' && <AccIcon name={p} size={16} />}
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <i className="ti ti-wifi-off" style={{ fontSize: 36, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{error}</div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, height: 40, padding: '0 20px', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Try Again</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && !error && (
        <div className="acc-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <i className="ti ti-package" style={{ fontSize: 36, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No products available</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Check back soon — new accounts are added regularly.</div>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''} available
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              <i className="ti ti-sort-ascending" style={{ fontSize: 13 }} /> Price: low to high
            </span>
          </div>
          <div className="acc-grid">
            {filtered.map(l => (
              <ProductCard key={l.id || l.slug} listing={l} onClick={openDetail} exchangeRate={exchangeRate} />
            ))}
          </div>
        </>
      )}

      {/* Detail sheet */}
      {detailListing && (
        <DetailSheet
          listing={detailListing}
          detail={detailData}
          detailLoading={detailLoading}
          balance={balance}
          onClose={() => setDetailListing(null)}
          onBuy={openPurchase}
          exchangeRate={exchangeRate}
        />
      )}

      {/* Purchase modal */}
      {purchaseListing && (
        <PurchaseModal
          listing={purchaseListing}
          qty={purchaseQty}
          balance={balance}
          token={token}
          onClose={() => setPurchaseListing(null)}
          onSuccess={() => { onPurchaseComplete?.(); }}
          onAddFunds={() => { setPurchaseListing(null); onNavigate && onNavigate('funds'); }}
          exchangeRate={exchangeRate}
        />
      )}
    </div>
  );
}
