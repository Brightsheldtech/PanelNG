import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

// ── Inline SVG icons (Heroicons outline style) ─────────────────────────
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const base = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color,
    strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    display: 'inline-block', flexShrink: 0, verticalAlign: 'middle',
    ...style,
  };
  switch (name) {
    case 'zap': return (
      <svg {...base}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} stroke="none" /></svg>
    );
    case 'message': return (
      <svg {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    );
    case 'users': return (
      <svg {...base}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
    case 'wallet': return (
      <svg {...base}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <circle cx="16" cy="14" r="1" fill={color} />
      </svg>
    );
    case 'trending-up': return (
      <svg {...base}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
    case 'shield-check': return (
      <svg {...base}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    );
    case 'arrow-right': return (
      <svg {...base}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    );
    case 'menu': return (
      <svg {...base}>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    );
    case 'x-close': return (
      <svg {...base}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
    case 'star': return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" display="inline-block" style={style}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
    case 'check': return (
      <svg {...base}><polyline points="20 6 9 17 4 12" /></svg>
    );
    default: return null;
  }
}

function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ── Animated stat counter ──────────────────────────────────────────────
function StatCounter({ target, prefix = '', suffix = '', label }) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const steps = Math.ceil(1400 / 16);
          let step = 0;
          const id = setInterval(() => {
            step++;
            setCount(Math.round((step / steps) * target));
            if (step >= steps) clearInterval(id);
          }, 16);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="ln-stat-cell">
      <div className="ln-stat-num">{prefix}{count}{suffix}</div>
      <div className="ln-stat-lbl">{label}</div>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Epilogue:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  .ln-root {
    background: #F8F7F4;
    min-height: 100vh;
    color: #111110;
    font-family: 'Epilogue', sans-serif;
    overflow-x: hidden;
  }
  .ln-root *, .ln-root *::before, .ln-root *::after { box-sizing: border-box; }

  /* ── Nav ── */
  .ln-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 40px;
    transition: padding 0.25s ease, background 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease;
  }
  .ln-nav.scrolled {
    background: rgba(248,247,244,0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid #E5E2D9;
    padding: 12px 40px;
  }
  .ln-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .ln-logo-box {
    width: 34px; height: 34px; background: #1C1C1A; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900; font-size: 16px;
    color: #F5A623; flex-shrink: 0;
  }
  .ln-logo-word {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 18px;
    color: #111110; letter-spacing: -0.3px;
  }
  .ln-nav-links { display: flex; align-items: center; gap: 4px; }
  .ln-nav-link {
    font-size: 14px; color: #6B6860; padding: 7px 14px; border-radius: 8px;
    border: none; background: none; cursor: pointer;
    font-family: 'Epilogue', sans-serif; text-decoration: none;
    transition: color 0.15s;
  }
  .ln-nav-link:hover { color: #111110; }
  .ln-nav-actions { display: flex; align-items: center; gap: 8px; }
  .ln-btn-ghost {
    font-size: 14px; color: #6B6860; padding: 8px 16px; border-radius: 9px;
    border: 1px solid #E5E2D9; background: white; cursor: pointer;
    font-family: 'Epilogue', sans-serif; text-decoration: none;
    transition: border-color 0.15s; white-space: nowrap; display: inline-block;
  }
  .ln-btn-ghost:hover { border-color: #CCC9C0; color: #111110; }
  .ln-btn-dark {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 14px;
    color: white; background: #1C1C1A; padding: 9px 18px; border-radius: 9px;
    border: none; cursor: pointer; text-decoration: none;
    transition: background 0.15s; white-space: nowrap; display: inline-block;
  }
  .ln-btn-dark:hover { background: #111110; }
  .ln-hamburger {
    width: 34px; height: 34px; border: 1px solid #E5E2D9; background: white;
    border-radius: 8px; display: none; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
  }

  /* ── Mobile overlay ── */
  .ln-mobile-overlay {
    position: fixed; inset: 0; background: white; z-index: 200;
    padding: 20px 24px; display: flex; flex-direction: column;
    transform: translateX(100%); transition: transform 0.25s ease;
    overflow-y: auto;
  }
  .ln-mobile-overlay.open { transform: translateX(0); }
  .ln-mobile-header {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px;
  }
  .ln-mobile-close {
    width: 34px; height: 34px; border: 1px solid #E5E2D9; background: white;
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  .ln-mobile-link {
    display: block; padding: 16px 0; font-size: 18px; color: #111110;
    border-bottom: 1px solid #F0EEE9; text-decoration: none;
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 600;
  }
  .ln-mobile-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 28px; }
  .ln-mobile-btn-ghost {
    display: flex; align-items: center; justify-content: center;
    padding: 14px; border-radius: 10px; border: 1px solid #E5E2D9;
    background: white; font-size: 15px; color: #111110; text-decoration: none;
    font-family: 'Epilogue', sans-serif; font-weight: 500;
  }
  .ln-mobile-btn-dark {
    display: flex; align-items: center; justify-content: center;
    padding: 14px; border-radius: 10px; background: #1C1C1A;
    font-size: 15px; color: white; text-decoration: none;
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; border: none;
  }

  /* ── Section labels ── */
  .ln-section-tag {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #C9620A; margin-bottom: 12px;
    font-family: 'Epilogue', sans-serif;
  }
  .ln-section-heading {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800;
    font-size: clamp(28px, 5vw, 44px); letter-spacing: -1.5px;
    color: #111110; line-height: 1.05; margin: 0;
  }

  /* ── Hero ── */
  .ln-hero {
    padding: 130px 40px 80px; max-width: 1120px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;
    min-height: 100vh;
  }
  .ln-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: white; border: 1px solid #E5E2D9; border-radius: 100px;
    padding: 5px 14px 5px 10px; margin-bottom: 28px;
  }
  .ln-hero-eyebrow-box {
    width: 22px; height: 22px; background: #1C1C1A; border-radius: 6px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ln-hero-eyebrow-text {
    font-family: 'Epilogue', sans-serif; font-size: 12px; font-weight: 600; color: #6B6860;
  }
  .ln-hero-h1 {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900;
    font-size: clamp(44px, 6vw, 68px); letter-spacing: -2.5px; line-height: 0.96;
    margin-bottom: 20px; margin-top: 0;
  }
  .ln-hero-p {
    font-size: 16px; color: #6B6860; line-height: 1.7;
    max-width: 400px; margin-bottom: 36px; margin-top: 0;
  }
  .ln-hero-btns { display: flex; flex-direction: column; gap: 10px; max-width: 340px; }
  .ln-cta-primary {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 15px 24px; border-radius: 12px; background: #1C1C1A; color: white;
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px;
    border: none; width: 100%; cursor: pointer; text-decoration: none;
    transition: background 0.15s, transform 0.1s;
  }
  .ln-cta-primary:hover { background: #111110; }
  .ln-cta-primary:active { transform: scale(0.98); }
  .ln-cta-google {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 13px 24px; border-radius: 12px; background: white;
    border: 1px solid #E5E2D9; font-family: 'Epilogue', sans-serif; font-weight: 600;
    font-size: 14px; color: #111110; width: 100%; cursor: pointer; text-decoration: none;
    transition: background 0.15s, border-color 0.15s;
  }
  .ln-cta-google:hover { background: #F0EEE9; border-color: #CCC9C0; }
  .ln-hero-fine {
    font-size: 12px; color: #A8A49C; text-align: center; margin-top: 2px;
    font-family: 'Epilogue', sans-serif;
  }

  /* ── Hero image ── */
  .ln-hero-img-area {
    position: relative; display: flex; align-items: center;
    justify-content: center; padding: 20px;
  }
  .ln-hero-img-container {
    width: 280px; height: 560px; border-radius: 24px; overflow: hidden;
    position: relative; flex-shrink: 0; background: #E8E5DC;
  }
  .ln-shimmer { width: 100%; height: 100%; background: #E8E5DC; position: relative; overflow: hidden; }
  .ln-shimmer::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
    background-size: 200% 100%; animation: ln-shimmer 1.5s infinite;
  }
  @keyframes ln-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
  .ln-hero-placeholder {
    background: #0D0D0B; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    width: 100%; height: 100%;
  }
  .ln-hero-placeholder-letter {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900; font-size: 48px; color: #F5A623;
  }
  .ln-hero-placeholder-label {
    font-family: 'Epilogue', sans-serif; font-size: 12px; color: #58564F;
  }
  .ln-badge-top {
    position: absolute; top: 6px; right: 6px;
    background: #16A34A; color: white; font-size: 11px; font-weight: 700;
    letter-spacing: 0.03em; padding: 6px 12px; border-radius: 100px;
    box-shadow: 0 4px 14px rgba(22,163,74,0.3); white-space: nowrap;
    font-family: 'Epilogue', sans-serif;
  }
  .ln-badge-bottom {
    position: absolute; bottom: 6px; left: 6px;
    background: white; border: 1px solid #E5E2D9; border-radius: 12px;
    padding: 10px 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    display: flex; align-items: center; gap: 8px;
  }
  .ln-badge-icon {
    width: 32px; height: 32px; background: rgba(201,98,10,0.1); border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ln-badge-val {
    font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 14px; color: #C9620A;
    display: block;
  }
  .ln-badge-lbl {
    font-family: 'Epilogue', sans-serif; font-size: 10px; color: #A8A49C; display: block;
  }

  /* ── Bento ── */
  .ln-bento {
    background: #F0EEE9;
    border-top: 1px solid #E5E2D9; border-bottom: 1px solid #E5E2D9;
    padding: 80px 40px;
  }
  .ln-bento-inner { max-width: 1120px; margin: 0 auto; }
  .ln-bento-grid {
    display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; margin-top: 48px;
  }
  .ln-card {
    background: white; border: 1px solid #E5E2D9; border-radius: 20px; padding: 28px 24px;
    position: relative; overflow: hidden; cursor: default;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .ln-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); transform: translateY(-2px); }
  .ln-card-icon {
    width: 44px; height: 44px; border-radius: 13px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 18px;
  }
  .ln-card-name {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 17px;
    color: #111110; margin-bottom: 8px; margin-top: 0;
  }
  .ln-card-desc {
    font-family: 'Epilogue', sans-serif; font-size: 13px; color: #6B6860;
    line-height: 1.6; margin-bottom: 14px; margin-top: 0;
  }
  .ln-card-checks { display: flex; flex-direction: column; gap: 6px; }
  .ln-card-check { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #6B6860; font-family: 'Epilogue', sans-serif; }
  .ln-card-pill {
    position: absolute; top: 20px; right: 20px; font-size: 9px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 8px; border-radius: 100px;
    font-family: 'Epilogue', sans-serif;
  }

  /* ── Stats ── */
  .ln-stats { max-width: 1120px; margin: 0 auto; padding: 80px 40px; }
  .ln-stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    border: 1px solid #E5E2D9; border-radius: 20px; overflow: hidden;
  }
  .ln-stat-cell { background: white; padding: 36px 28px; border-right: 1px solid #E5E2D9; }
  .ln-stat-cell:last-child { border-right: none; }
  .ln-stat-num {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 40px;
    letter-spacing: -2px; line-height: 1; color: #111110; margin-bottom: 6px;
  }
  .ln-stat-lbl { font-family: 'Epilogue', sans-serif; font-size: 13px; color: #6B6860; }

  /* ── How it works ── */
  .ln-how { max-width: 1120px; margin: 0 auto; padding: 0 40px 80px; text-align: center; }
  .ln-how .ln-section-tag { display: block; }
  .ln-steps {
    display: grid; grid-template-columns: repeat(4, 1fr);
    margin-top: 48px; text-align: left;
  }
  .ln-step { padding: 28px 24px 28px 0; border-right: 1px solid #E5E2D9; }
  .ln-step + .ln-step { padding-left: 28px; }
  .ln-step:last-child { border-right: none; }
  .ln-step-num {
    font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500;
    color: #A8A49C; letter-spacing: 0.05em; margin-bottom: 14px; display: block;
  }
  .ln-step-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
  }
  .ln-step-title {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px;
    color: #111110; margin-bottom: 6px; margin-top: 0;
  }
  .ln-step-desc { font-family: 'Epilogue', sans-serif; font-size: 13px; color: #6B6860; line-height: 1.6; margin: 0; }

  /* ── Referral ── */
  .ln-referral { background: #1C1C1A; padding: 80px 40px; }
  .ln-referral-inner {
    max-width: 1120px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
  }
  .ln-ref-tag {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: #F5A623; margin-bottom: 14px; font-family: 'Epilogue', sans-serif;
  }
  .ln-ref-heading {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800;
    font-size: clamp(28px, 4vw, 42px); letter-spacing: -1.5px; color: #EDEBE4;
    line-height: 1.05; margin-bottom: 16px; margin-top: 0;
  }
  .ln-ref-p { font-size: 15px; color: #9A9690; line-height: 1.7; margin-bottom: 32px; margin-top: 0; }
  .ln-ref-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .ln-ref-num-box {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 20px 14px; text-align: center;
  }
  .ln-ref-num-val {
    font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 22px;
    color: #F5A623; margin-bottom: 4px; display: block;
  }
  .ln-ref-num-lbl { font-size: 11px; color: #58564F; font-family: 'Epilogue', sans-serif; }
  .ln-ref-steps { display: flex; flex-direction: column; gap: 0; }
  .ln-ref-step {
    display: flex; align-items: flex-start; gap: 16px; padding-bottom: 24px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .ln-ref-step + .ln-ref-step { padding-top: 24px; }
  .ln-ref-step:last-child { border-bottom: none; padding-bottom: 0; }
  .ln-ref-step-num {
    width: 32px; height: 32px; border-radius: 9px;
    background: rgba(245,166,35,0.12); border: 1px solid rgba(245,166,35,0.2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #F5A623; flex-shrink: 0;
  }
  .ln-ref-step-title { font-size: 14px; font-weight: 600; color: #EDEBE4; margin-bottom: 3px; margin-top: 0; }
  .ln-ref-step-desc { font-size: 13px; color: #9A9690; line-height: 1.5; margin: 0; }

  /* ── Testimonials ── */
  .ln-testimonials { max-width: 1120px; margin: 0 auto; padding: 80px 40px; }
  .ln-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 48px; }
  .ln-testi-card { background: white; border: 1px solid #E5E2D9; border-radius: 18px; padding: 24px; }
  .ln-stars { display: flex; gap: 3px; margin-bottom: 12px; }
  .ln-testi-quote {
    font-family: 'Epilogue', sans-serif; font-size: 14px; line-height: 1.7;
    color: #6B6860; margin-bottom: 20px; margin-top: 0;
  }
  .ln-testi-author { display: flex; align-items: center; gap: 10px; }
  .ln-testi-avatar {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 13px; flex-shrink: 0;
  }
  .ln-testi-name { font-size: 13px; font-weight: 600; color: #111110; font-family: 'Epilogue', sans-serif; }
  .ln-testi-loc { font-size: 11px; color: #A8A49C; margin-top: 1px; font-family: 'Epilogue', sans-serif; }

  /* ── CTA bottom ── */
  .ln-cta-section { border-top: 1px solid #E5E2D9; padding: 80px 40px; }
  .ln-cta-inner {
    max-width: 1120px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;
  }
  .ln-cta-h {
    font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900;
    font-size: clamp(36px, 5vw, 56px); letter-spacing: -2px; color: #111110;
    margin-bottom: 14px; margin-top: 0;
  }
  .ln-cta-p { font-size: 15px; color: #6B6860; line-height: 1.7; margin: 0; }
  .ln-cta-no-cc { font-size: 12px; color: #A8A49C; text-align: center; margin-top: 8px; }

  /* ── Footer ── */
  .ln-footer { border-top: 1px solid #E5E2D9; padding: 32px 40px; }
  .ln-footer-inner {
    max-width: 1120px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .ln-footer-links { display: flex; gap: 24px; }
  .ln-footer-link {
    font-size: 13px; color: #A8A49C; text-decoration: none;
    transition: color 0.15s; font-family: 'Epilogue', sans-serif;
  }
  .ln-footer-link:hover { color: #6B6860; }
  .ln-footer-copy {
    font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #A8A49C;
  }

  /* ── Responsive 900px ── */
  @media (max-width: 900px) {
    .ln-nav { padding: 14px 20px; }
    .ln-nav.scrolled { padding: 10px 20px; }
    .ln-nav-links { display: none; }
    .ln-nav-actions .ln-btn-ghost,
    .ln-nav-actions .ln-btn-dark { display: none; }
    .ln-hamburger { display: flex; }

    .ln-hero {
      grid-template-columns: 1fr; padding: 100px 20px 64px;
      min-height: unset; gap: 32px;
    }
    .ln-hero-right { order: -1; }
    .ln-hero-img-area { justify-content: center; }
    .ln-hero-img-container { width: 240px; height: 480px; }
    .ln-hero-p { max-width: 100%; }
    .ln-hero-btns { max-width: 100%; }

    .ln-bento { padding: 64px 20px; }
    .ln-bento-grid { grid-template-columns: repeat(2, 1fr); }
    .ln-bento-grid > * { grid-column: span 1 !important; }

    .ln-stats { padding: 64px 20px; }
    .ln-stats-grid { grid-template-columns: repeat(2, 1fr); }
    .ln-stat-cell:nth-child(2) { border-right: none; }
    .ln-stat-cell:nth-child(3) { border-top: 1px solid #E5E2D9; }
    .ln-stat-cell:nth-child(4) { border-right: none; border-top: 1px solid #E5E2D9; }

    .ln-how { padding: 0 20px 64px; }
    .ln-steps { grid-template-columns: repeat(2, 1fr); }
    .ln-step { padding: 20px 16px 20px 0; }
    .ln-step + .ln-step { padding-left: 16px; }
    .ln-step:nth-child(even) { border-right: none; }
    .ln-step:nth-child(3),
    .ln-step:nth-child(4) { border-top: 1px solid #E5E2D9; }

    .ln-referral { padding: 64px 20px; }
    .ln-referral-inner { grid-template-columns: 1fr; gap: 40px; }

    .ln-testimonials { padding: 64px 20px; }
    .ln-testi-grid { grid-template-columns: 1fr; }

    .ln-cta-section { padding: 64px 20px; }
    .ln-cta-inner { grid-template-columns: 1fr; gap: 32px; }

    .ln-footer { padding: 24px 20px; }
    .ln-footer-inner { flex-direction: column; align-items: flex-start; }
  }

  /* ── Responsive 500px ── */
  @media (max-width: 500px) {
    .ln-bento-grid { grid-template-columns: 1fr; }
    .ln-bento-grid > * { grid-column: span 1 !important; }
    .ln-steps { grid-template-columns: 1fr; }
    .ln-step { border-right: none !important; border-top: none; border-bottom: 1px solid #E5E2D9; padding: 20px 0 !important; }
    .ln-step + .ln-step { padding-left: 0 !important; }
    .ln-step:last-child { border-bottom: none; }
    .ln-step:nth-child(3), .ln-step:nth-child(4) { border-top: none; }
    .ln-hero-img-container { width: 240px; height: 480px; }
  }
`;

// ── Component ──────────────────────────────────────────────────────────
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState(null);
  const [heroImageLoading, setHeroImageLoading] = useState(true);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    api.get('/settings/hero_image_url')
      .then(res => setHeroImageUrl(res.data?.value || ''))
      .catch(() => setHeroImageUrl(''))
      .finally(() => setHeroImageLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => { if (window.innerWidth > 900) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <style>{css}</style>
      <div className="ln-root">

        {/* ── NAV ── */}
        <nav className={`ln-nav${scrolled ? ' scrolled' : ''}`}>
          <Link to="/" className="ln-logo">
            <div className="ln-logo-box">P</div>
            <span className="ln-logo-word">PanelNG</span>
          </Link>
          <div className="ln-nav-links">
            <a href="#services" className="ln-nav-link">Services</a>
            <a href="#how" className="ln-nav-link">How it works</a>
            <a href="#referral" className="ln-nav-link">Referral</a>
          </div>
          <div className="ln-nav-actions">
            <Link to="/login" className="ln-btn-ghost">Sign In</Link>
            <Link to="/register" className="ln-btn-dark">Get Started →</Link>
            <button className="ln-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Icon name="menu" size={18} color="#111110" />
            </button>
          </div>
        </nav>

        {/* ── MOBILE MENU ── */}
        <div className={`ln-mobile-overlay${mobileOpen ? ' open' : ''}`} aria-modal="true">
          <div className="ln-mobile-header">
            <div className="ln-logo">
              <div className="ln-logo-box">P</div>
              <span className="ln-logo-word">PanelNG</span>
            </div>
            <button className="ln-mobile-close" onClick={closeMobile} aria-label="Close menu">
              <Icon name="x-close" size={18} color="#111110" />
            </button>
          </div>
          <a href="#services" className="ln-mobile-link" onClick={closeMobile}>Services</a>
          <a href="#how" className="ln-mobile-link" onClick={closeMobile}>How it works</a>
          <a href="#referral" className="ln-mobile-link" onClick={closeMobile}>Referral</a>
          <div className="ln-mobile-btns">
            <Link to="/login" className="ln-mobile-btn-ghost" onClick={closeMobile}>Sign In</Link>
            <Link to="/register" className="ln-mobile-btn-dark" onClick={closeMobile}>Get Started →</Link>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="ln-hero">
          {/* Left */}
          <div>
            <div className="ln-hero-eyebrow">
              <div className="ln-hero-eyebrow-box">
                <Icon name="zap" size={12} color="#F5A623" />
              </div>
              <span className="ln-hero-eyebrow-text">Nigeria's SMM, SMS and accounts panel</span>
            </div>
            <h1 className="ln-hero-h1">
              <span style={{ color: '#111110' }}>One wallet.</span><br />
              <span style={{ color: '#C9620A' }}>Three services.</span><br />
              <span style={{ color: '#111110' }}>All in naira.</span>
            </h1>
            <p className="ln-hero-p">
              Grow social accounts, get SMS verification numbers and buy verified social media accounts — all from a single Naira wallet. No dollar conversion. No switching apps.
            </p>
            <div className="ln-hero-btns">
              <Link to="/register" className="ln-cta-primary">
                Create Free Account&nbsp;<Icon name="arrow-right" size={16} color="white" />
              </Link>
              <Link to="/register" className="ln-cta-google">
                <GoogleIcon size={18} />
                Continue with Google
              </Link>
              <div className="ln-hero-fine">Free to sign up · No minimum deposit · No monthly fee</div>
            </div>
          </div>

          {/* Right — app preview */}
          <div className="ln-hero-img-area ln-hero-right">
            <div className="ln-hero-img-container">
              {heroImageLoading ? (
                <div className="ln-shimmer" />
              ) : heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt="PanelNG app preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', borderRadius: 24, display: 'block' }}
                  loading="lazy"
                  onError={() => setHeroImageUrl('')}
                />
              ) : (
                <div className="ln-hero-placeholder">
                  <span className="ln-hero-placeholder-letter">P</span>
                  <span className="ln-hero-placeholder-label">App preview</span>
                </div>
              )}
            </div>
            <div className="ln-badge-top">Delivered in seconds</div>
            <div className="ln-badge-bottom">
              <div className="ln-badge-icon">
                <Icon name="wallet" size={16} color="#C9620A" />
              </div>
              <div>
                <span className="ln-badge-val">₦12,840</span>
                <span className="ln-badge-lbl">Wallet balance</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES BENTO ── */}
        <section id="services" className="ln-bento">
          <div className="ln-bento-inner">
            <div className="ln-section-tag">What PanelNG does</div>
            <h2 className="ln-section-heading">Everything a Nigerian digital operator needs</h2>
            <div className="ln-bento-grid">

              {/* SMM Panel — span 5 */}
              <div className="ln-card" style={{ gridColumn: 'span 5' }}>
                <div className="ln-card-pill" style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A' }}>500+ SERVICES</div>
                <div className="ln-card-icon" style={{ background: 'rgba(22,163,74,0.08)' }}>
                  <Icon name="trending-up" size={20} color="#16A34A" />
                </div>
                <p className="ln-card-name">SMM Panel</p>
                <p className="ln-card-desc">500+ services on Instagram, TikTok, YouTube, Twitter/X and Facebook. Followers, likes, views and comments sourced directly from JustAnotherPanel. Priced in naira.</p>
                <div className="ln-card-checks">
                  {['Real-time delivery tracking', 'Min/max quantity controls', 'Admin-set pricing per service'].map(p => (
                    <div key={p} className="ln-card-check">
                      <Icon name="check" size={12} color="#16A34A" />{p}
                    </div>
                  ))}
                </div>
              </div>

              {/* SMS Verify — span 4 */}
              <div className="ln-card" style={{ gridColumn: 'span 4' }}>
                <div className="ln-card-icon" style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <Icon name="message" size={20} color="#7C3AED" />
                </div>
                <p className="ln-card-name">SMS Verify</p>
                <p className="ln-card-desc">Virtual numbers for 18+ apps. OTP auto-detected — no manual refresh.</p>
                <div className="ln-card-checks">
                  {['WhatsApp · Telegram · Instagram', '18+ supported platforms', 'Refund if no OTP in 20 min'].map(p => (
                    <div key={p} className="ln-card-check">
                      <Icon name="check" size={12} color="#7C3AED" />{p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Buy Accounts — span 3 */}
              <div className="ln-card" style={{ gridColumn: 'span 3' }}>
                <div className="ln-card-pill" style={{ background: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>NEW</div>
                <div className="ln-card-icon" style={{ background: 'rgba(13,148,136,0.08)' }}>
                  <Icon name="users" size={20} color="#0D9488" />
                </div>
                <p className="ln-card-name">Buy Accounts</p>
                <p className="ln-card-desc">Pre-verified Facebook, Gmail, Instagram and more. Instant delivery via ACCSZONE.</p>
                <div className="ln-card-checks">
                  {['Replacement guarantee', 'Aged and fresh options', 'Email access included'].map(p => (
                    <div key={p} className="ln-card-check">
                      <Icon name="check" size={12} color="#0D9488" />{p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Naira Wallet — span 4, second row */}
              <div className="ln-card" style={{ gridColumn: 'span 4' }}>
                <div className="ln-card-icon" style={{ background: 'rgba(201,98,10,0.08)' }}>
                  <Icon name="wallet" size={20} color="#C9620A" />
                </div>
                <p className="ln-card-name">Naira Wallet</p>
                <p className="ln-card-desc">One wallet. Fund via Flutterwave or bank transfer. Spend across all three services.</p>
                <div className="ln-card-checks">
                  {['No FX conversion', 'Instant credit', 'Full transaction history'].map(p => (
                    <div key={p} className="ln-card-check">
                      <Icon name="check" size={12} color="#C9620A" />{p}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="ln-stats">
          <div className="ln-stats-grid">
            <StatCounter target={1200} suffix="+" label="Active Users" />
            <StatCounter target={500} suffix="+" label="SMM Services" />
            <StatCounter target={4} prefix="₦" suffix="M+" label="Orders Processed" />
            <StatCounter target={99} suffix="%" label="Delivery Rate" />
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="ln-how">
          <div className="ln-section-tag">How it works</div>
          <h2 className="ln-section-heading">Up and running in four steps</h2>
          <div className="ln-steps">
            {[
              { num: '01', icon: 'users',        bg: 'rgba(201,98,10,0.1)',   color: '#C9620A', title: 'Create Account',  desc: 'Sign up with Google in one tap. No KYC, no waiting.' },
              { num: '02', icon: 'wallet',       bg: 'rgba(37,99,235,0.1)',   color: '#2563EB', title: 'Fund Your Wallet', desc: 'Top up in naira via Flutterwave or bank transfer. Instant credit.' },
              { num: '03', icon: 'trending-up',  bg: 'rgba(22,163,74,0.1)',   color: '#16A34A', title: 'Place Orders',    desc: 'Order SMM services, get SMS numbers, buy verified accounts.' },
              { num: '04', icon: 'shield-check', bg: 'rgba(124,58,237,0.1)',  color: '#7C3AED', title: 'Track and Grow',  desc: 'Monitor every order live from your dashboard.' },
            ].map(({ num, icon, bg, color, title, desc }) => (
              <div key={num} className="ln-step">
                <span className="ln-step-num">{num}</span>
                <div className="ln-step-icon" style={{ background: bg }}>
                  <Icon name={icon} size={18} color={color} />
                </div>
                <p className="ln-step-title">{title}</p>
                <p className="ln-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── REFERRAL ── */}
        <section id="referral" className="ln-referral">
          <div className="ln-referral-inner">
            <div>
              <div className="ln-ref-tag">Referral Program</div>
              <h2 className="ln-ref-heading">Earn while they spend</h2>
              <p className="ln-ref-p">
                Refer anyone to PanelNG and earn a bonus when they place their first order. Then earn 5% on every order they make — with no cap and no expiry.
              </p>
              <div className="ln-ref-nums">
                {[
                  { val: '₦500', lbl: 'First order bonus' },
                  { val: '5%',   lbl: 'Per order, lifetime' },
                  { val: '₦200', lbl: 'Referee credit' },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="ln-ref-num-box">
                    <span className="ln-ref-num-val">{val}</span>
                    <span className="ln-ref-num-lbl">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ln-ref-steps">
              {[
                { n: '01', title: 'Share your link or code',      desc: 'Send your unique referral link or code to anyone — clients, friends, social media followers.' },
                { n: '02', title: 'They sign up and order',        desc: 'When they create an account and place their first order, you both get credited instantly.' },
                { n: '03', title: 'Earn on every future order',    desc: 'Commissions hit your wallet within 24 hours. No cap. Works as long as they keep ordering.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="ln-ref-step">
                  <div className="ln-ref-step-num">{n}</div>
                  <div>
                    <p className="ln-ref-step-title">{title}</p>
                    <p className="ln-ref-step-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="ln-testimonials">
          <div className="ln-section-tag">What users say</div>
          <h2 className="ln-section-heading">Real operators, real results</h2>
          <div className="ln-testi-grid">
            {[
              { quote: 'I use it every week for client Instagram growth. Lower prices than any other panel and it is in naira. No more Binance stress.', name: 'Tolu Adeyemi', loc: 'Digital marketer · Lagos',        init: 'TA', bg: 'rgba(201,98,10,0.1)',  color: '#C9620A' },
              { quote: 'Bought a WhatsApp number and the OTP came automatically in seconds. Cleanest SMS panel in Nigeria by far.',                      name: 'Chidi Okafor',  loc: 'SMM operator · Abuja',           init: 'CO', bg: 'rgba(37,99,235,0.1)',  color: '#2563EB' },
              { quote: 'I fund once, handle my clients Instagram growth, get SMS numbers and buy accounts all in one place. Nothing else does this.',     name: 'Sade Williams', loc: 'Social media manager · PH',      init: 'SW', bg: 'rgba(22,163,74,0.1)',  color: '#16A34A' },
            ].map(({ quote, name, loc, init, bg, color }) => (
              <div key={name} className="ln-testi-card">
                <div className="ln-stars">
                  {[0,1,2,3,4].map(i => <Icon key={i} name="star" size={14} color="#E07B10" />)}
                </div>
                <p className="ln-testi-quote">"{quote}"</p>
                <div className="ln-testi-author">
                  <div className="ln-testi-avatar" style={{ background: bg, color }}>{init}</div>
                  <div>
                    <div className="ln-testi-name">{name}</div>
                    <div className="ln-testi-loc">{loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="ln-cta-section">
          <div className="ln-cta-inner">
            <div>
              <h2 className="ln-cta-h">Ready to move?</h2>
              <p className="ln-cta-p">No monthly fee. No minimum deposit. Pay only for what you order. Create your account in under a minute.</p>
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/register" className="ln-cta-primary">
                  Create Free Account&nbsp;<Icon name="arrow-right" size={16} color="white" />
                </Link>
                <Link to="/register" className="ln-cta-google">
                  <GoogleIcon size={18} />
                  Continue with Google
                </Link>
              </div>
              <div className="ln-cta-no-cc">No credit card required</div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="ln-footer">
          <div className="ln-footer-inner">
            <Link to="/" className="ln-logo">
              <div className="ln-logo-box">P</div>
              <span className="ln-logo-word">PanelNG</span>
            </Link>
            <div className="ln-footer-links">
              <a href="#" className="ln-footer-link">Privacy Policy</a>
              <a href="#" className="ln-footer-link">Terms of Service</a>
              <a href="#" className="ln-footer-link">Contact</a>
            </div>
            <div className="ln-footer-copy">PanelNG © {new Date().getFullYear()} · Built for Nigerian operators</div>
          </div>
        </footer>

      </div>
    </>
  );
}
